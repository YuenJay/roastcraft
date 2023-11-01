// SPDX-License-Identifier: GPL-3.0-or-later

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Config {
    pub version: String,
    pub brand: String,
    pub model: String,
    // pub metrics_ids: Vec<String>,
    pub serial: Option<Serial>,
}

impl Config {
    pub fn new() -> Self {
        Self {
            version: String::new(),
            brand: String::new(),
            model: String::new(),
            // metrics_ids: Vec::new(),
            serial: None,
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Serial {
    pub port: String,
    pub baud_rate: u32,
    pub data_bits: u32,
    pub parity: String,
    pub stop_bits: u32,
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
    pub id: u8,
    pub function: u8,
    pub registry: u16,
    pub multiplier: f32,
}
