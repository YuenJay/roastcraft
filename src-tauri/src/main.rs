// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{CustomMenuItem, Menu, MenuItem, Submenu, Manager, State};
use tauri_plugin_log::{LogTarget};
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
fn button_on_clicked(app: tauri::AppHandle) -> () {
    
    trace!("button_on_clicked");
    app.emit_all("synchronized", ()).unwrap();
    trace!("event synchronized emitted");

    let state_mutex = app.state::<Mutex<RoastCraftState>>();
    let mut state = state_mutex.lock().unwrap();

    state.join_handle = Some(spawn(async move {
        loop {
            
            sleep(Duration::from_millis(5000)).await;
            info!("i am inside async process 1, 5 sec passed");
        }
    }));
}

#[tauri::command]
fn button_off_clicked(app: tauri::AppHandle) -> () {
    
    trace!("button_on_clicked");
    app.emit_all("synchronized", ()).unwrap();
    trace!("event synchronized emitted");

    let state_mutex = app.state::<Mutex<RoastCraftState>>();
    let mut state = state_mutex.lock().unwrap();

    match &state.join_handle {
        Some(handle) => handle.abort(),
        None => error!("join_handle is None")
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
        ]).build())
        .manage(Mutex::new(RoastCraftState::default()))
        // .setup(|app| {
        //     let app_handle = app.handle();
        //     tauri::async_runtime::spawn(async move {
        //         loop {
                    
        //             sleep(Duration::from_millis(5000)).await;
        //             info!("i am inside async process, 5 sec passed");
        //         }
        //     });

        //     Ok(())
        // })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
