// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{CustomMenuItem, Menu, MenuItem, Submenu, Manager, State};
use tauri_plugin_log::{LogTarget, fern::colors::ColoredLevelConfig};
use log::{error, warn, info, debug, trace};
use tokio::time::{sleep, Duration};
use std::sync::Mutex;
use tauri::async_runtime::{spawn, JoinHandle};

struct RoastCraftState {
    join_handle : Option<JoinHandle<()>>
}

impl Default for RoastCraftState {
    fn default() -> Self {
        Self {
            join_handle: None
            
        }
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

    let state_mutex = app.state::<Mutex<RoastCraftState>>();
    let mut state = state_mutex.lock().unwrap();

    match &state.join_handle {
        Some(_handle) =>  warn!("join_handle already exist"),
        None =>{
            state.join_handle = Some(spawn(async move {
                loop {
                    
                    sleep(Duration::from_millis(3000)).await;
                    info!("i am inside async process, 3 sec passed");
                }
            }));
        
            debug!("spawned join_handle : {:?}", state.join_handle.as_ref().unwrap())
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
            debug!("aborted join_handle : {:?}", state.join_handle.as_ref().unwrap());
            state.join_handle = None;
        }        
        None => warn!("join_handle is None")
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
        .invoke_handler(tauri::generate_handler![greet, button_on_clicked, button_off_clicked])
        .plugin(tauri_plugin_log::Builder::default().targets([
                LogTarget::LogDir,
                LogTarget::Stdout,
                LogTarget::Webview,
            ])
            .with_colors(ColoredLevelConfig::default())
            .build())
        .manage(Mutex::new(RoastCraftState::default()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
