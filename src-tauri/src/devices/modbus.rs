// SPDX-License-Identifier: GPL-3.0-or-later

use async_trait::async_trait;
use log::{debug, error, trace};
use serde_json::{Map, Value};
use std::io::{Error, ErrorKind};
use tokio::time;
use tokio_modbus::{
    client::{rtu, Context},
    prelude::Reader,
    slave::SlaveContext,
    Slave,
};

use super::Device;
use crate::config::Config;

pub struct ModbusDevice {
    ctx: Context,
    config: Config,
}

impl ModbusDevice {
    pub fn new(config: Config) -> ModbusDevice {
        let serial = config.serial.as_ref().unwrap();

        let mut builder = tokio_serial::new(serial.port.clone(), serial.baud_rate as u32);

        if serial.data_bits == 8 {
            builder = builder.data_bits(tokio_serial::DataBits::Eight);
        } else if serial.data_bits == 7 {
            builder = builder.data_bits(tokio_serial::DataBits::Seven);
        } else if serial.data_bits == 6 {
            builder = builder.data_bits(tokio_serial::DataBits::Six);
        } else if serial.data_bits == 5 {
            builder = builder.data_bits(tokio_serial::DataBits::Five);
        }

        let parity_lowercase = serial.parity.to_lowercase();
        if parity_lowercase == "none" {
            builder = builder.parity(tokio_serial::Parity::None);
        } else if parity_lowercase == "even" {
            builder = builder.parity(tokio_serial::Parity::Even);
        } else if parity_lowercase == "odd" {
            builder = builder.parity(tokio_serial::Parity::Odd);
        }

        if serial.stop_bits == 1 {
            builder = builder.stop_bits(tokio_serial::StopBits::One)
        } else if serial.stop_bits == 2 {
            builder = builder.stop_bits(tokio_serial::StopBits::Two)
        }

        debug!("{:?}", builder);

        let port = tokio_serial::SerialStream::open(&builder).unwrap();
        let ctx = rtu::attach(port);

        ModbusDevice { ctx, config }
    }
}

#[async_trait]
impl Device for ModbusDevice {
    async fn read(self: &mut Self) -> Result<Value, Error> {
        let mut map = Map::new();

        // 10 seconds timeout
        let res = tokio::time::timeout(time::Duration::from_secs(10), async {
            // read registers
            let config = &self.config;
            let serial = config.serial.as_ref().unwrap();
            let modbus = serial.modbus.as_ref().unwrap();
            let slaves = &modbus.slave;

            for slave in slaves {
                self.ctx.set_slave(Slave(slave.id as u8));

                // only support function = 3 (read holding register)
                match self
                    .ctx
                    .read_holding_registers(slave.registry as u16, 1)
                    .await
                {
                    Ok(v) => {
                        let result = *v.get(0).unwrap() as f32 / slave.divisor as f32;

                        trace!("{} : {:.1}", slave.metrics_id, result);
                        map.insert(
                            slave.metrics_id.clone(),
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
