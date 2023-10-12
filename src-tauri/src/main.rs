// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::{debug, error, info, trace, warn};
use serde_json::{json, Map, Value};
use std::sync::Mutex;
use tauri::async_runtime::{spawn, JoinHandle};
use tauri::{CustomMenuItem, Manager, Menu, MenuItem, State, Submenu};
use tauri_plugin_log::{fern::colors::ColoredLevelConfig, LogTarget};
use tokio::time::{interval, Duration};
use tokio_modbus::prelude::*;

struct RoastCraftState {
    join_handle: Option<JoinHandle<()>>,
}

impl Default for RoastCraftState {
    fn default() -> Self {
        Self { join_handle: None }
    }
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn button_on_clicked(app: tauri::AppHandle) -> () {
    trace!("command called : button_on_clicked");

    app.emit_all("synchronized", ()).unwrap();
    trace!("event synchronized emitted");

    let app2 = app.clone();

    let state_mutex = app.state::<Mutex<RoastCraftState>>();
    let mut state = state_mutex.lock().unwrap();

    match &state.join_handle {
        Some(_handle) => warn!("join_handle already exist"),
        None => {
            state.join_handle = Some(spawn(async move {
                let mut interval = interval(Duration::from_secs(3));
                let tty_path = "COM3";
                let builder = tokio_serial::new(tty_path, 9600);
                let port = tokio_serial::SerialStream::open(&builder).unwrap();
                let mut ctx = rtu::attach(port);

                let metrics_count = 3;

                let mut vec_metrics_ids: Vec<String> = Vec::new();
                vec_metrics_ids.push("exhaust_temp".to_string());
                vec_metrics_ids.push("bean_temp".to_string());
                vec_metrics_ids.push("inlet_temp".to_string());

                let mut vec_slaves: Vec<Slave> = Vec::new();
                vec_slaves.push(Slave(1));
                vec_slaves.push(Slave(2));
                vec_slaves.push(Slave(3));

                loop {
                    interval.tick().await;
                    info!("i am inside async process, 3 sec interval");
                    // let mut vec_results: Vec<f32> = Vec::new();
                    let mut map = Map::new();

                    for i in 0..metrics_count {
                        ctx.set_slave(vec_slaves[i]);
                        match ctx.read_holding_registers(18176, 1).await {
                            Ok(v) => {
                                let result = *v.get(0).unwrap() as f32 * 0.1;
                                // vec_results.push(result);
                                debug!("Sensor value is: {:.1}", result);
                                map.insert(
                                    vec_metrics_ids[i].clone(),
                                    Value::String(format!("{:.1}", result)),
                                );
                            }
                            Err(_) => {
                                error!("read_holding_registers failed");
                            }
                        }
                    }

                    let payload = Value::Object(map);

                    app2.emit_all("read_metrics", payload).unwrap();
                    trace!("event read_metrics emitted");
                }
            }));

            debug!(
                "spawned join_handle : {:?}",
                state.join_handle.as_ref().unwrap()
            )
        }
    }
}

#[tauri::command]
async fn button_off_clicked(app: tauri::AppHandle) -> () {
    trace!("command called : button_off_clicked");

    let state_mutex = app.state::<Mutex<RoastCraftState>>();
    let mut state = state_mutex.lock().unwrap();

    match &state.join_handle {
        Some(handle) => {
            handle.abort();
            debug!(
                "aborted join_handle : {:?}",
                state.join_handle.as_ref().unwrap()
            );
            state.join_handle = None;
        }
        None => warn!("join_handle is None"),
    }
}

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let close = CustomMenuItem::new("close".to_string(), "Close");
    let submenu = Submenu::new("File", Menu::new().add_item(quit).add_item(close));
    let menu = Menu::new()
        .add_native_item(MenuItem::Copy)
        .add_item(CustomMenuItem::new("hide", "Hide"))
        .add_submenu(submenu);

    tauri::Builder::default()
        .menu(menu)
        .invoke_handler(tauri::generate_handler![
            greet,
            button_on_clicked,
            button_off_clicked
        ])
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([LogTarget::LogDir, LogTarget::Stdout, LogTarget::Webview])
                .with_colors(ColoredLevelConfig::default())
                .build(),
        )
        .manage(Mutex::new(RoastCraftState::default()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
