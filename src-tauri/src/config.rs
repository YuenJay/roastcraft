// SPDX-License-Identifier: GPL-3.0-or-later

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct Config {
    pub version: String,
    pub brand: String,
    pub model: String,
    pub serial: Option<Serial>,
    pub tcp: Option<Tcp>,
    pub manual: Option<Manual>,
}

impl Config {
    pub fn new() -> Self {
        Self {
            version: String::new(),
            brand: String::new(),
            model: String::new(),
            serial: None,
            tcp: None,
            manual: None,
        }
    }
}

// LEVEL 1
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

// LEVEL 1
#[derive(Serialize, Deserialize, Clone)]
pub struct Tcp {
    pub ip: String,
    pub port: u16,
    pub modbus: Option<Modbus>,
    pub http: Option<Http>,
}

// LEVEL 1
#[derive(Serialize, Deserialize, Clone)]
pub struct Manual {
    pub manualChannel: Vec<ManualChannel>,
}

// LEVEL 2
#[derive(Serialize, Deserialize, Clone)]
pub struct Ta612c {
    pub channel: Vec<Channel>,
}

// LEVEL 2
#[derive(Serialize, Deserialize, Clone)]
pub struct Modbus {
    pub protocol: String,
    pub slave: Vec<Slave>,
}

// LEVEL 2
#[derive(Serialize, Deserialize, Clone)]
pub struct Http {
    pub channel: Vec<Channel>,
}

// LEVEL 3
#[derive(Serialize, Deserialize, Clone)]
pub struct Channel {
    pub channel_id: String,
    pub label: String,
    pub unit: String,
    pub color: String,
    pub ror_color: Option<String>,
}

// LEVEL 3
#[derive(Serialize, Deserialize, Clone)]
pub struct Slave {
    pub channel_id: String,        // Channel
    pub label: String,             // Channel
    pub unit: String,              // Channel
    pub color: String,             // Channel
    pub ror_color: Option<String>, // Channel
    pub id: u16,
    pub function: u16,
    pub registry: u16,
    pub divisor: u16,
    pub decode_type: String,
}

// LEVEL 2
#[derive(Serialize, Deserialize, Clone)]
pub struct ManualChannel {
    pub channel_id: String, // Channel
    pub label: String,      // Channel
    pub unit: String,       // Channel
    pub color: String,      // Channel
    pub min: u16,
    pub max: u16,
    pub step: u16,
    pub default: u16,
}
