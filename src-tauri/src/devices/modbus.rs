// SPDX-License-Identifier: GPL-3.0-or-later

use async_trait::async_trait;
use log::{debug, error, trace};
use rmodbus::{
    client::ModbusRequest, generate_ascii_frame, guess_response_frame_len, parse_ascii_frame,
    ModbusProto,
};
use serde_json::{to_value, Map, Value};
use serialport::{DataBits, Parity, SerialPort, StopBits};
use std::{
    io::{Error, ErrorKind},
    time::Duration,
};
use tokio::time;

use super::Device;
use crate::config::{Config, Slave};

pub struct ModbusDevice {
    stream: Box<dyn SerialPort>,
    config: Config,
}

impl ModbusDevice {
    pub fn new(config: Config) -> ModbusDevice {
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

        ModbusDevice { stream, config }
    }
}

async fn ascii(slave: &Slave, stream: &mut Box<dyn SerialPort>) -> f64 {
    // create request object
    let mut mreq = ModbusRequest::new(slave.id as u8, ModbusProto::Ascii);
    let mut request = Vec::new();

    // get holding registers
    mreq.generate_get_holdings(slave.registry, 1, &mut request)
        .unwrap();

    let mut request_ascii = Vec::new();
    generate_ascii_frame(&request, &mut request_ascii).unwrap();
    stream.write(&request_ascii).unwrap();

    let mut buf = [0u8; 7];
    stream.read_exact(&mut buf).unwrap();
    let mut response_ascii = Vec::new();
    response_ascii.extend_from_slice(&buf);
    let len = guess_response_frame_len(&buf, ModbusProto::Ascii).unwrap();
    if len > 7 {
        let mut rest = vec![0u8; (len - 7) as usize];
        stream.read_exact(&mut rest).unwrap();
        response_ascii.extend(rest);
    }

    let mut response = vec![0; (len as usize - 3) / 2];
    parse_ascii_frame(&response_ascii, len as usize, &mut response, 0).unwrap();
    // println!("response {:02X?}", response);
    let mut data = Vec::new();

    mreq.parse_u16(&response, &mut data).unwrap();

    let rounded_number = (data[0] as f64 * 10.0).round() / 100.0;

    rounded_number
}

async fn rtu(slave: &Slave, stream: &mut Box<dyn SerialPort>) -> f64 {
    // create request object
    let mut mreq = ModbusRequest::new(slave.id as u8, ModbusProto::Rtu);
    let mut request = Vec::new();

    // get holding registers
    mreq.generate_get_holdings(slave.registry, 1, &mut request)
        .unwrap();

    stream.write(&request).unwrap();

    let mut buf = [0u8; 7];
    stream.read_exact(&mut buf).unwrap();
    let mut response = Vec::new();
    response.extend_from_slice(&buf);
    let len = guess_response_frame_len(&buf, ModbusProto::Rtu).unwrap();

    if len > 7 {
        let mut rest = vec![0u8; (len - 7) as usize];
        stream.read_exact(&mut rest).unwrap();
        response.extend(rest);
    }

    let mut data = Vec::new();

    // check if frame has no Modbus error inside and parse response bools into data vec
    mreq.parse_u16(&response, &mut data).unwrap();
    // for i in 0..data.len() {
    //     println!("{} {}", i, data[i]);
    // }

    let rounded_number = (data[0] as f64 * 10.0).round() / 100.0;
    // println!("{} : {}", slave.channel_id, rounded_number);
    rounded_number
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
                let mut rounded_number: f64;
                if (modbus.protocol == "modbus-rtu") {
                    rounded_number = rtu(slave, &mut self.stream).await;
                } else {
                    rounded_number = ascii(slave, &mut self.stream).await;
                }

                map.insert(
                    slave.channel_id.clone(),
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
