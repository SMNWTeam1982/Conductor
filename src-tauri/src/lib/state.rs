use crate::lib::ipc;
use ds::{Alliance, Mode};
use serde_json::{json, Value};
use std::sync;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex;

#[tauri::command]
pub fn set_active_page(state: State<sync::Mutex<ipc::AppState>>, page: u32) {
    let mut app_state = state.lock().unwrap();
    let active_page = match page {
        0 => ipc::ActivePage::Overview,
        1 => ipc::ActivePage::Settings,
        2 => ipc::ActivePage::Input,
        3_u32..=u32::MAX => todo!(),
    };
    app_state.active_page = active_page;
}

#[tauri::command]
pub fn get_active_page(state: State<sync::Mutex<ipc::AppState>>) -> u32 {
    let app_state = state.lock().unwrap();
    let active_page = match app_state.active_page {
        ipc::ActivePage::Overview => 0,
        ipc::ActivePage::Settings => 1,
        ipc::ActivePage::Input => 2,
    };
    return active_page;
}

#[tauri::command]
pub async fn set_enabled(
    app: AppHandle,
    state: State<'_, Mutex<ipc::DriverStationState>>,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.set_enabled().await;
    let _ = app.emit("enabled-state", app_state.ds.get_enable_status().await);
    Ok(())
}

#[tauri::command]
pub async fn set_disabled(
    app: AppHandle,
    state: State<'_, Mutex<ipc::DriverStationState>>,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.set_disabled().await;
    let _ = app.emit("enabled-state", app_state.ds.get_enable_status().await);
    Ok(())
}

#[tauri::command]
pub async fn get_enable_status(
    app: AppHandle,
    state: State<'_, Mutex<ipc::DriverStationState>>,
) -> Result<bool, ()> {
    let mut app_state = state.lock().await;
    let enabled = app_state.ds.get_enable_status().await;
    let _ = app.emit("enabled-state", enabled);
    Ok(enabled)
}

#[tauri::command]
pub async fn set_estopped(
    app: AppHandle,
    state: State<'_, Mutex<ipc::DriverStationState>>,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.set_estopped().await;
    let estopped = app_state.ds.get_estopped().await;
    let enabled = app_state.ds.get_enable_status().await;
    let _ = app.emit("estopped-state", estopped);
    let _ = app.emit("enabled-state", enabled);
    Ok(())
}

#[tauri::command]
pub async fn get_estopped(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<bool, ()> {
    let mut app_state = state.lock().await;
    Ok(app_state.ds.get_estopped().await)
}

#[tauri::command]
pub async fn set_team_number(
    app: AppHandle,
    state: State<'_, Mutex<ipc::DriverStationState>>,
    team_number: u32,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.set_team_number(app, team_number).await;
    Ok(())
}

#[tauri::command]
pub async fn get_team_number(
    app: AppHandle,
    state: State<'_, Mutex<ipc::DriverStationState>>,
) -> Result<u32, ()> {
    let mut app_state = state.lock().await;
    let team_number = app_state.ds.get_team_number(app).await;
    Ok(team_number)
}

#[tauri::command]
pub async fn set_game_data(
    state: State<'_, Mutex<ipc::DriverStationState>>,
    gsm: String,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.set_game_data(gsm).await;
    Ok(())
}

#[tauri::command]
pub async fn get_game_data(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<String, ()> {
    let mut app_state = state.lock().await;
    Ok(app_state.ds.get_game_data().await)
}

#[tauri::command]
pub async fn set_usb_conn(
    state: State<'_, Mutex<ipc::DriverStationState>>,
    value: bool,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.set_usb_conn(value).await;
    Ok(())
}

#[tauri::command]
pub async fn get_usb_conn(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<bool, ()> {
    let mut app_state = state.lock().await;
    Ok(app_state.ds.get_usb_conn().await)
}

#[tauri::command]
pub async fn restart_code(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.restart_code().await;
    Ok(())
}

#[tauri::command]
pub async fn restart_rio(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.restart_rio().await;
    Ok(())
}

#[tauri::command]
pub async fn set_drive_mode(
    app: AppHandle,
    state: State<'_, Mutex<ipc::DriverStationState>>,
    mode: u32,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    let active_mode = match mode {
        0 => Mode::Autonomous,
        1 => Mode::Teleoperated,
        2 => Mode::Test,
        3_u32..=u32::MAX => unreachable!(),
    };
    let _ = app.emit("drive-mode", mode);
    app_state.ds.set_drive_mode(active_mode).await;
    Ok(())
}
#[tauri::command]
pub async fn get_drive_mode(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<u32, ()> {
    let mut app_state = state.lock().await;
    match app_state.ds.get_drive_mode().await {
        Mode::Autonomous => Ok(0),
        Mode::Teleoperated => Ok(1),
        Mode::Test => Ok(2),
    }
}

#[tauri::command]
pub async fn set_alliance(
    app: AppHandle,
    state: State<'_, Mutex<ipc::DriverStationState>>,
    alliance: u32,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    let active_alliance = match alliance {
        0 => Alliance::new_red(1),
        1 => Alliance::new_red(2),
        2 => Alliance::new_red(3),
        3 => Alliance::new_blue(1),
        4 => Alliance::new_blue(2),
        5 => Alliance::new_blue(3),
        6_u32..=u32::MAX => unreachable!(),
    };
    let _ = app.emit("alliance", alliance);
    app_state.ds.set_alliance(active_alliance).await;
    Ok(())
}
#[tauri::command]
pub async fn get_alliance(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<u32, ()> {
    let mut app_state = state.lock().await;
    let active_alliance = app_state.ds.get_alliance().await;
    Ok((active_alliance.position() - 1 + if active_alliance.is_red() { 0 } else { 3 }).into())
}

#[tauri::command]
pub async fn get_ds_state(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<Value, ()> {
    let mut app_state = state.lock().await;
    let has_comms = app_state.ds.get_comms_status().await;
    let has_code = app_state.ds.get_code_status().await;
    let is_sim = app_state.ds.get_simulator().await;
    Ok(json!({
        "hasComms": has_comms || is_sim,
        "hasCode": has_code || is_sim,
        "hasJoysticks": false,
        "isSimulator": is_sim
    }))
}

#[tauri::command]
pub async fn get_battery_voltage(
    state: State<'_, Mutex<ipc::DriverStationState>>,
) -> Result<f32, ()> {
    let mut app_state = state.lock().await;
    Ok(app_state.ds.get_battery_voltage().await)
}

#[tauri::command]
pub async fn console_init(
    app: AppHandle,
    state: State<'_, Mutex<ipc::DriverStationState>>,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.handle_console_init(app).await;
    Ok(())
}

#[tauri::command]
pub async fn console_action(
    app: AppHandle,
    state: State<'_, Mutex<ipc::DriverStationState>>,
    action: ipc::ConsoleAction,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.handle_console_action(app, action).await?;
    Ok(())
}