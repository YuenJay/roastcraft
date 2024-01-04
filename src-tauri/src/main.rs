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
    fn new() -> Self {
        Self {
            reader_handle: None,
            config: Config::new(),
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

                let mut device: Box<dyn Device + Send>;

                // serial has priority over tcp
                match config.serial {
                    Some(_) => {
                        device = Box::new(devices::modbus::ModbusDevice::new(config));
                    }
                    None => {
                        device = Box::new(devices::http::HttpDevice::new(config));
                    }
                }

                loop {
                    interval.tick().await;
                    trace!("i am inside async process, 2 sec interval");

                    match device.read().await {
                        Ok(json_value) => {
                            app2.emit_all("read_channels", &json_value).unwrap();
                            trace!("event read_channels emitted : {}", json_value);
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
    let open = CustomMenuItem::new("open".to_string(), "Open");
    let ghost = CustomMenuItem::new("ghost".to_string(), "Ghost");
    let save = CustomMenuItem::new("save".to_string(), "Save");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let submenu = Submenu::new(
        "File",
        Menu::new()
            .add_item(open)
            .add_item(ghost)
            .add_item(save)
            .add_item(quit),
    );
    let menu = Menu::new().add_submenu(submenu);

    tauri::Builder::default()
        .menu(menu)
        .on_menu_event(|event| match event.menu_item_id() {
            "open" => {
                event.window().emit("menu_event", "OPEN").unwrap();
            }
            "ghost" => {
                event.window().emit("menu_event", "GHOST").unwrap();
            }
            "save" => {
                event.window().emit("menu_event", "SAVE").unwrap();
            }
            "quit" => {
                std::process::exit(0);
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            button_on_clicked,
            button_off_clicked,
            get_config,
        ])
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([LogTarget::LogDir, LogTarget::Stdout, LogTarget::Webview])
                .with_colors(ColoredLevelConfig::default())
                .level(LevelFilter::Info)
                .build(),
        )
        .manage(Mutex::new(RoastCraftState::new()))
        .setup(|app| {
            // default config file name
            // in reldase/debug mode, put roastcraft.toml in the same folder with roastcraft.exe
            // in dev mode, put roastcraft.toml in /src-tauri
            let mut config_file_name = String::from("roastcraft.toml");

            // get cli argument
            match app.get_cli_matches() {
                // pass cli args in dev mode:
                // pnpm tauri dev -- -- --config=../machines/kapok/501_inlet.toml
                Ok(matches) => {
                    if matches.args.get("config").unwrap().value.is_string() {
                        config_file_name = matches
                            .args
                            .get("config")
                            .unwrap()
                            .value
                            .as_str()
                            .unwrap()
                            .to_string();
                    }
                    println!("{}", config_file_name);
                }
                Err(_) => {}
            }

            let mut parse_config_err_msg: String = String::new();
            let mut parse_config_ok = false;
            let mut toml_content = String::new();

            let state_mutex = app.state::<Mutex<RoastCraftState>>();
            let mut state = state_mutex.lock().unwrap();

            match File::open(&config_file_name) {
                Ok(mut file) => {
                    match file.read_to_string(&mut toml_content) {
                        Ok(_) => {
                            // At this point, `contents` contains the content of the TOML file
                            match toml::from_str::<Config>(toml_content.as_str()) {
                                Ok(c) => {
                                    parse_config_ok = true;
                                    state.config = c;
                                }
                                Err(e) => {
                                    parse_config_err_msg = format!(
                                        "Failed to parse {config_file_name} \n{}",
                                        e.message()
                                    );
                                }
                            }
                        }
                        Err(_) => {
                            parse_config_err_msg = format!("Failed to read {config_file_name}");
                        }
                    }
                }
                Err(_) => {
                    parse_config_err_msg = format!("Failed to open {config_file_name}");
                }
            }

            println!("parsed Config: ");
            println!("{}", toml::to_string(&state.config).unwrap());

            if !parse_config_ok {
                let main_window = app.get_window("main").unwrap();
                tauri::api::dialog::message(Some(&main_window), "RoastCraft", parse_config_err_msg);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
