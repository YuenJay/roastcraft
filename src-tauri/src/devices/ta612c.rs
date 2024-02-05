// SPDX-License-Identifier: GPL-3.0-or-later

use async_trait::async_trait;
use log::error;
use serde_json::{to_value, Map, Value};
use serialport::{DataBits, Parity, SerialPort, StopBits};
use std::{
    io::{Error, ErrorKind},
    time::Duration,
};
use tokio::time;

use super::Device;
use crate::config::Config;

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

        let stream = serialport::new(&serial.port, serial.baud_rate as u32)
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
            let config = &self.config;
            let serial = config.serial.as_ref().unwrap();
            let ta612c = serial.ta612c.as_ref().unwrap();
            let channels = &ta612c.channel;

            let request: [u8; 5] = [0xAA, 0x55, 0x01, 0x03, 0x03];
            let _ = self.stream.write(&request);

            let mut response: [u8; 13] = [0; 13];

            match self.stream.read(response.as_mut_slice()) {
                Ok(_) => {
                    let t1 = u16::from_ne_bytes(response[4..6].try_into().unwrap()) as f32 / 10.0;
                    let t2 = u16::from_ne_bytes(response[6..8].try_into().unwrap()) as f32 / 10.0;
                    let t3 = u16::from_ne_bytes(response[8..10].try_into().unwrap()) as f32 / 10.0;
                    let t4 = u16::from_ne_bytes(response[10..12].try_into().unwrap()) as f32 / 10.0;

                    for (i, c) in channels.iter().enumerate() {
                        if i == 0 {
                            map.insert(
                                c.channel_id.clone(),
                                to_value(t1).expect("Conversion failed"),
                            );
                        }
                        if i == 1 {
                            map.insert(
                                c.channel_id.clone(),
                                to_value(t2).expect("Conversion failed"),
                            );
                        }
                        if i == 2 {
                            map.insert(
                                c.channel_id.clone(),
                                to_value(t3).expect("Conversion failed"),
                            );
                        }
                        if i == 3 {
                            map.insert(
                                c.channel_id.clone(),
                                to_value(t4).expect("Conversion failed"),
                            );
                        }
                    }
                }
                Err(_) => {}
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
