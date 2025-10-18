// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use conductor_ds_lib::lib::state;
use conductor_ds_lib::lib::window::calculate_window_size;
use std::sync::Mutex;
use tauri::{Builder, Manager, WebviewWindowBuilder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(Mutex::new(state::DsState::new()))
        .manage(Mutex::new(state::AppState::new()))
        .invoke_handler(tauri::generate_handler![
            state::set_active_page,
            state::update_team_number,
            state::get_team_number,
            state::enable,
            state::disable,
            state::estop,
            state::set_mode,
            state::get_mode,
            state::set_alliance,
            state::get_alliance,
            state::get_robotstate,
            state::start_stdout,
        ])
        .setup(|app| {
            let (width, height) = calculate_window_size(app.app_handle());
            WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::App("index.html#".into()))
                .title("Conductor - Driver Station")
                .resizable(true)
                .inner_size(width, height)
                .build()
                .expect("Failed to create main window");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
