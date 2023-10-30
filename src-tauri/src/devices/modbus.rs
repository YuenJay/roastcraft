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
        let mut builder = tokio_serial::new(tty, baud_rate);

        let data_bits = config["serial"]["data_bits"].as_integer().unwrap();
        if data_bits == 8 {
            builder = builder.data_bits(tokio_serial::DataBits::Eight);
        } else if data_bits == 7 {
            builder = builder.data_bits(tokio_serial::DataBits::Seven);
        } else if data_bits == 6 {
            builder = builder.data_bits(tokio_serial::DataBits::Six);
        } else if data_bits == 5 {
            builder = builder.data_bits(tokio_serial::DataBits::Five);
        }

        let parity = config["serial"]["parity"].as_str().unwrap().to_lowercase();
        if parity == "none" {
            builder = builder.parity(tokio_serial::Parity::None);
        } else if parity == "even" {
            builder = builder.parity(tokio_serial::Parity::Even);
        } else if parity == "odd" {
            builder = builder.parity(tokio_serial::Parity::Odd);
        }

        let stop_bits = config["serial"]["stop_bits"].as_integer().unwrap();
        if stop_bits == 1 {
            builder = builder.stop_bits(tokio_serial::StopBits::One)
        } else if stop_bits == 2 {
            builder = builder.stop_bits(tokio_serial::StopBits::Two)
        }

        debug!("{:?}", builder);

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
