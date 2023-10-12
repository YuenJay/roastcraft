use log::{debug, error};
use serde_json::{Map, Value};
use tokio_modbus::{
    client::{rtu, Context},
    prelude::Reader,
    slave::SlaveContext,
    Slave,
};

pub struct Device {
    ctx: Context,
    metrics_count: usize,
    vec_metrics_ids: Vec<String>,
    vec_slaves: Vec<Slave>,
}

impl Device {
    pub fn new() -> Device {
        let tty = "COM3";
        let builder = tokio_serial::new(tty, 9600);
        let port = tokio_serial::SerialStream::open(&builder).unwrap();
        let mut ctx = rtu::attach(port);

        let mut vec_metrics_ids: Vec<String> = Vec::new();
        vec_metrics_ids.push("exhaust_temp".to_string());
        vec_metrics_ids.push("bean_temp".to_string());
        vec_metrics_ids.push("inlet_temp".to_string());

        let mut vec_slaves: Vec<Slave> = Vec::new();
        vec_slaves.push(Slave(1));
        vec_slaves.push(Slave(2));
        vec_slaves.push(Slave(3));

        Device {
            ctx: ctx,
            metrics_count: 3,
            vec_metrics_ids: vec_metrics_ids,
            vec_slaves: vec_slaves,
        }
    }

    pub async fn read(&mut self) -> Value {
        println!("called devices::modbus::read()");

        let mut map = Map::new();

        for i in 0..self.metrics_count {
            self.ctx.set_slave(self.vec_slaves[i]);
            match self.ctx.read_holding_registers(18176, 1).await {
                Ok(v) => {
                    let result = *v.get(0).unwrap() as f32 * 0.1;
                    // vec_results.push(result);
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

        Value::Object(map)
    }
}
