// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use conductor_ds_lib::lib::{backend, input, ipc, state, window};
use std::sync;
use tauri::{Builder, Manager, WebviewWindowBuilder};
use tauri_plugin_store::StoreExt;
use tokio::sync::{mpsc, Mutex};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    let (ds_command_tx, ds_command_rx) = mpsc::channel(1);
    let (ds_response_tx, ds_response_rx) = mpsc::channel(1);
    Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(sync::Mutex::new(ipc::AppState::new()))
        .manage(sync::Mutex::new(ipc::InputState::new()))
        .invoke_handler(tauri::generate_handler![
            state::set_active_page,
            state::get_active_page,
            state::enable,
            state::disable,
            state::get_enabled,
            state::estop,
            state::get_estopped,
            state::update_team_number,
            state::get_team_number,
            state::update_game_data,
            state::get_game_data,
            state::use_usb,
            state::get_usb,
            state::restart_code,
            state::restart_roborio,
            state::set_mode,
            state::get_mode,
            state::set_alliance,
            state::get_alliance,
            state::get_robotstate,
            state::manage_console,
            state::get_last_console_output,
            input::has_joysticks,
            input::add_mapping,
            input::emit_inputs,
            input::update_mappings,
            window::create_console_window
        ])
        .setup(|app| {
            let store = app.store("settings.json")?;
            let team_number = store
                .get("teamNumber")
                .and_then(|v| v.as_u64())
                .map(|v| v as u32)
                .unwrap_or(0);
            tauri::async_runtime::spawn(async move {
                backend::driver_station_thread(ds_command_rx, ds_response_tx, team_number).await
            });
            let (width, height) = window::calculate_window_size(app.app_handle());
            WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::App("index.html#main".into()),
            )
            .title("Conductor - Driver Station")
            .resizable(false)
            .inner_size(width, height)
            .build()
            .expect("Failed to create main window");
            app.manage(Mutex::new(ipc::DriverStationState::new(team_number, ds_command_tx, ds_response_rx)));

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
