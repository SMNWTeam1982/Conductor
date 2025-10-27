// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use conductor_ds_lib::lib::{input, ipc, state, window};
use std::sync::Mutex;
use tauri::{Builder, Manager, WebviewWindowBuilder};
use tauri_plugin_store::StoreExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(Mutex::new(ipc::AppState::new()))
        // .manage(Mutex::new(ipc::JoystickState::new()))
        .invoke_handler(tauri::generate_handler![
            state::set_active_page,
            state::get_active_page,
            state::enable,
            state::disable,
            state::estop,
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
            input::update_mappings,
            window::create_console_window,
        ])
        .setup(|app| {
            let _store = app.store("settings.json")?;
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
            let ds_state = ipc::DriverStationState::new(app);
            app.manage(Mutex::new(ds_state));

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
