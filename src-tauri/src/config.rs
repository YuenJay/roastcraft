use serde::{Deserialize, Serialize};
use toml::value::Array;

#[derive(Serialize, Deserialize)]
pub struct Config {
    pub version: String,
    pub brand: String,
    pub model: String,
    pub metrics_ids: Array,
    pub serial: Option<Serial>,
}

impl Config {
    pub fn new() -> Self {
        Self {
            version: String::new(),
            brand: String::new(),
            model: String::new(),
            metrics_ids: Vec::new(),
            serial: None,
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct Serial {
    pub port: String,
    pub baud_rate: u32,
    pub data_bits: u32,
    pub parity: String,
    pub stop_bits: u32,
    pub modbus: Option<Modbus>,
}

#[derive(Serialize, Deserialize)]
pub struct Modbus {
    pub protocol: String,
    pub slave: Array,
}
