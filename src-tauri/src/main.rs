// SPDX-License-Identifier: GPL-3.0-or-later

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::{debug, trace, warn, LevelFilter};
use std::fs::File;
use std::io::Read;
use std::sync::Mutex;
use tauri::async_runtime::{spawn, JoinHandle};
use tauri::{CustomMenuItem, Manager, Menu, MenuItem, Submenu};
use tauri_plugin_log::{fern::colors::ColoredLevelConfig, LogTarget};
use tokio::time::{interval, Duration};

use crate::config::Config;
use crate::devices::Device;

mod config;
mod devices;

struct RoastCraftState {
    reader_handle: Option<JoinHandle<()>>,
    config: Config,
}

impl RoastCraftState {
    fn new(config: Config) -> Self {
        Self {
            reader_handle: None,
            config: config,
        }
    }
}

#[tauri::command]
async fn button_on_clicked(app: tauri::AppHandle) -> () {
    trace!("command called : button_on_clicked");

    let app2 = app.clone();

    let state_mutex = app.state::<Mutex<RoastCraftState>>();
    let mut state = state_mutex.lock().unwrap();

    let config = state.config.clone();
    match &state.reader_handle {
        Some(_handle) => warn!("reader_handle already exist"),
        None => {
            state.reader_handle = Some(spawn(async move {
                let mut interval = interval(Duration::from_secs(2));

                // todo: choose device based on config
                // let mut device: Box<dyn Device + Send> =
                //     Box::new(devices::modbus::ModbusDevice::new(config));
                let mut device: Box<dyn Device + Send> =
                    Box::new(devices::http::HttpDevice::new(config));

                loop {
                    interval.tick().await;
                    trace!("i am inside async process, 2 sec interval");

                    match device.read().await {
                        Ok(json_value) => {
                            app2.emit_all("read_metrics", json_value).unwrap();
                            trace!("event read_metrics emitted");
                        }
                        Err(_) => {}
                    }
                }
            }));

            debug!(
                "spawned reader_handle : {:?}",
                state.reader_handle.as_ref().unwrap()
            )
        }
    }
}

#[tauri::command]
async fn button_off_clicked(app: tauri::AppHandle) -> () {
    trace!("command called : button_off_clicked");

    let state_mutex = app.state::<Mutex<RoastCraftState>>();
    let mut state = state_mutex.lock().unwrap();

    match &state.reader_handle {
        Some(handle) => {
            handle.abort();
            debug!(
                "aborted reader_handle : {:?}",
                state.reader_handle.as_ref().unwrap()
            );
            state.reader_handle = None;
        }
        None => warn!("reader_handle is None"),
    }
}

#[tauri::command]
async fn get_config(app: tauri::AppHandle) -> Config {
    let state_mutex = app.state::<Mutex<RoastCraftState>>();
    let state = state_mutex.lock().unwrap();
    state.config.clone()
}

fn main() {
    // in dev mode, put roastcraft.config.toml in /src-tauri
    let mut parse_config_err_msg: String = String::new();
    let mut parse_config_ok = false;
    let mut toml_content = String::new();
    let mut config = Config::new();
    match File::open("roastcraft.config.toml") {
        Ok(mut file) => {
            match file.read_to_string(&mut toml_content) {
                Ok(_) => {
                    // At this point, `contents` contains the content of the TOML file
                    match toml::from_str::<Config>(toml_content.as_str()) {
                        Ok(c) => {
                            parse_config_ok = true;
                            config = c;
                        }
                        Err(e) => {
                            parse_config_err_msg
                                .push_str("Failed to parse roastcraft.config.toml \n");
                            parse_config_err_msg.push_str(e.message());
                        }
                    }
                }
                Err(_) => {
                    parse_config_err_msg = "Failed to read roastcraft.config.toml".to_string();
                }
            }
        }
        Err(_) => {
            parse_config_err_msg = "Failed to open roastcraft.config.toml".to_string();
        }
    }

    println!("parsed Config: ");
    println!("{}", toml::to_string(&config).unwrap());

    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let close = CustomMenuItem::new("close".to_string(), "Close");
    let submenu = Submenu::new("File", Menu::new().add_item(quit).add_item(close));
    let menu = Menu::new()
        // .add_native_item(MenuItem::Copy)
        // .add_item(CustomMenuItem::new("hide", "Hide"))
        .add_submenu(submenu);

    tauri::Builder::default()
        .menu(menu)
        .invoke_handler(tauri::generate_handler![
            button_on_clicked,
            button_off_clicked,
            get_config,
        ])
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([LogTarget::LogDir, LogTarget::Stdout, LogTarget::Webview])
                .with_colors(ColoredLevelConfig::default())
                .level(LevelFilter::Trace)
                .build(),
        )
        .manage(Mutex::new(RoastCraftState::new(config)))
        .setup(move |app| {
            if !parse_config_ok {
                let main_window = app.get_window("main").unwrap();
                tauri::api::dialog::message(Some(&main_window), "RoastCraft", parse_config_err_msg);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
