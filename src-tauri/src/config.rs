// SPDX-License-Identifier: GPL-3.0-or-later

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Config {
    pub version: String,
    pub brand: String,
    pub model: String,
    pub serial: Option<Serial>,
    pub tcp: Option<Tcp>,
}

impl Config {
    pub fn new() -> Self {
        Self {
            version: String::new(),
            brand: String::new(),
            model: String::new(),
            serial: None,
            tcp: None,
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Serial {
    pub port: String,
    pub baud_rate: u16,
    pub data_bits: u16,
    pub parity: String,
    pub stop_bits: u16,
    pub modbus: Option<Modbus>,
    pub ta612c: Option<Ta612c>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Tcp {
    pub ip: String,
    pub port: u16,
    pub modbus: Option<Modbus>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Modbus {
    pub protocol: String,
    pub slave: Vec<Slave>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Slave {
    pub metrics_id: String,
    pub label: String,
    pub id: u16,
    pub function: u16,
    pub registry: u16,
    pub divisor: u16,
    pub number_type: String,
    pub unit: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Ta612c {
    pub metrics_id_list: Vec<String>,
}
