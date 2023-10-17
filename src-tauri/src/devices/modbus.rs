use std::io::{Error, ErrorKind};

use super::Device;
use async_trait::async_trait;
use log::{debug, error};
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
    metrics_count: usize,
    vec_metrics_ids: Vec<String>,
    vec_slaves: Vec<Slave>,
}

impl ModbusDevice {
    pub fn new() -> ModbusDevice {
        let tty = "COM3";
        let builder = tokio_serial::new(tty, 9600);
        let port = tokio_serial::SerialStream::open(&builder).unwrap();
        let ctx = rtu::attach(port);

        let mut vec_metrics_ids: Vec<String> = Vec::new();
        vec_metrics_ids.push("exhaust_temp".to_string());
        vec_metrics_ids.push("bean_temp".to_string());
        vec_metrics_ids.push("inlet_temp".to_string());

        let mut vec_slaves: Vec<Slave> = Vec::new();
        vec_slaves.push(Slave(1));
        vec_slaves.push(Slave(2));
        vec_slaves.push(Slave(3));

        ModbusDevice {
            ctx: ctx,
            metrics_count: 3,
            vec_metrics_ids: vec_metrics_ids,
            vec_slaves: vec_slaves,
        }
    }
}

#[async_trait]
impl Device for ModbusDevice {
    async fn read(self: &mut Self) -> Result<Value, Error> {
        println!("called devices::modbus::read()");

        let mut map = Map::new();

        // 10 seconds timeout
        let res = tokio::time::timeout(time::Duration::from_secs(10), async {
            // read registers
            for i in 0..self.metrics_count {
                self.ctx.set_slave(self.vec_slaves[i]);

                match self.ctx.read_holding_registers(18176, 1).await {
                    Ok(v) => {
                        let result = *v.get(0).unwrap() as f32 * 0.1;

                        debug!("Sensor value is: {:.1}", result);
                        map.insert(
                            self.vec_metrics_ids[i].clone(),
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
                return Err(Error::new(ErrorKind::Other, "oh no!"));
            }
        }

        Ok(Value::Object(map))
    }
}
