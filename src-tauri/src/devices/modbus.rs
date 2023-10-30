// SPDX-License-Identifier: GPL-3.0-or-later

use std::io::{Error, ErrorKind};

use super::Device;
use async_trait::async_trait;
use log::{debug, error, trace};
use serde_json::{Map, Value};
use tokio::time;
use tokio_modbus::{
    client::{rtu, Context},
    prelude::Reader,
    slave::SlaveContext,
    Slave,
};

pub struct ModbusDevice {
    ctx: Context,
    config: toml::Table,
}

impl ModbusDevice {
    pub fn new(config: toml::Table) -> ModbusDevice {
        let tty = config["serial"]["port"].as_str().unwrap();
        let baud_rate = config["serial"]["baud_rate"].as_integer().unwrap() as u32;
        let builder = tokio_serial::new(tty, baud_rate);
        let port = tokio_serial::SerialStream::open(&builder).unwrap();
        let ctx = rtu::attach(port);

        ModbusDevice {
            ctx: ctx,
            config: config,
        }
    }
}

#[async_trait]
impl Device for ModbusDevice {
    async fn read(self: &mut Self) -> Result<Value, Error> {
        debug!("called devices::modbus::read()");

        let mut map = Map::new();

        // 10 seconds timeout
        let res = tokio::time::timeout(time::Duration::from_secs(10), async {
            // read registers
            for slave in self.config["serial"]["modbus"]["slave"].as_array().unwrap() {
                self.ctx
                    .set_slave(Slave(slave["id"].as_integer().unwrap() as u8));

                match self
                    .ctx
                    .read_holding_registers(slave["registry"].as_integer().unwrap() as u16, 1)
                    .await
                {
                    Ok(v) => {
                        let result = *v.get(0).unwrap() as f32 * 0.1;

                        trace!("Sensor value is: {:.1}", result);
                        map.insert(
                            slave["metrics_id"].as_str().unwrap().to_string(),
                            Value::String(format!("{:.1}", result)),
                        );
                    }
                    Err(_) => {
                        error!("read_holding_registers failed");
                    }
                }
            }
        });

        match res.await {
            Ok(_) => (),
            Err(_) => {
                error!("read_holding_registers timeout");
                return Err(Error::new(
                    ErrorKind::Other,
                    "read_holding_registers timeout",
                ));
            }
        }

        Ok(Value::Object(map))
    }
}
