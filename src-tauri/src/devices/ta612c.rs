// SPDX-License-Identifier: GPL-3.0-or-later

use async_trait::async_trait;
use log::{debug, error, trace};
use serde_json::{to_value, Map, Value};
use serialport::{DataBits, Parity, SerialPort, StopBits};
use std::{
    io::{Error, ErrorKind},
    time::Duration,
};
use tokio::time;

use super::Device;
use crate::config::{Config, Slave};

pub struct Ta612cDevice {
    config: Config,
    stream: Box<dyn SerialPort>,
}

impl Ta612cDevice {
    pub fn new(config: Config) -> Ta612cDevice {
        let serial = config.serial.as_ref().unwrap();

        let timeout = Duration::from_secs(1);

        let mut data_bits = DataBits::Eight;
        if serial.data_bits == 7 {
            data_bits = DataBits::Seven;
        } else if serial.data_bits == 6 {
            data_bits = DataBits::Six;
        } else if serial.data_bits == 5 {
            data_bits = DataBits::Five;
        }

        let mut parity = Parity::None;
        let parity_lowercase = serial.parity.to_lowercase();
        if parity_lowercase == "even" {
            parity = Parity::Even;
        } else if parity_lowercase == "odd" {
            parity = Parity::Odd;
        }

        let mut stop_bits = StopBits::One;
        if serial.stop_bits == 2 {
            stop_bits = StopBits::Two;
        }

        let mut stream = serialport::new(&serial.port, serial.baud_rate as u32)
            .data_bits(data_bits)
            .parity(parity)
            .stop_bits(stop_bits)
            .timeout(timeout)
            .open()
            .expect("Failed to open port");

        Ta612cDevice { stream, config }
    }
}

#[async_trait]
impl Device for Ta612cDevice {
    async fn read(self: &mut Self) -> Result<Value, Error> {
        let mut map = Map::new();

        // 10 seconds timeout
        let res = tokio::time::timeout(time::Duration::from_secs(10), async {
            // read registers
            let config = &self.config;
            let serial = config.serial.as_ref().unwrap();
            let ta612c = serial.ta612c.as_ref().unwrap();
            let channels = &ta612c.channel;

            for channel in channels {
                let mut rounded_number: f64 = 12.0;

                map.insert(
                    channel.channel_id.clone(),
                    to_value(rounded_number).expect("Conversion failed"),
                );
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
        // println!("result map : {:?} ", map);
        Ok(Value::Object(map))
    }
}
