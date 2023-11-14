// SPDX-License-Identifier: GPL-3.0-or-later

use async_trait::async_trait;
use log::{debug, error, trace};
use serde_json::{Map, Value};
use std::io::{Error, ErrorKind};
use tokio::time;

use super::Device;
use crate::config::Config;

pub struct HttpDevice {
    config: Config,
    client: reqwest::Client,
}

impl HttpDevice {
    pub fn new(config: Config) -> HttpDevice {
        let client = reqwest::Client::new();

        HttpDevice { config, client }
    }
}

#[async_trait]
impl Device for HttpDevice {
    async fn read(self: &mut Self) -> Result<Value, Error> {
        let mut map = Map::new();
        let mut res_json: Value = Value::Null;

        // 10 seconds timeout
        let res = tokio::time::timeout(time::Duration::from_secs(10), async {
            // read channels
            let config = &self.config;
            let tcp = config.tcp.as_ref().unwrap();
            let http = tcp.http.as_ref().unwrap();
            let channels = &http.channel;

            let req = self.client.get("http://localhost:3000");
            let res_str = req.send().await.unwrap().text().await.unwrap();
            res_json = serde_json::from_str(&res_str).unwrap();

            // for channel in channels {}
        });

        match res.await {
            Ok(_) => (),
            Err(_) => {
                error!("http request timeout");
                return Err(Error::new(ErrorKind::Other, "http request timeout"));
            }
        }

        // Ok(Value::Object(map))
        Ok(res_json)
    }
}
