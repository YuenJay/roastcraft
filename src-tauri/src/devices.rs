use async_trait::async_trait;
use serde_json::Value;

pub mod modbus;
pub mod ta612c;

#[async_trait]
pub trait Device {
    async fn read(self: &mut Self) -> Value;
    
}