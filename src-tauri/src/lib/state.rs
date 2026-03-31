use crate::lib::ipc;
use ds::{Alliance, Mode};
use serde_json::{json, Value};
use std::sync;
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_store::StoreExt;
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
pub async fn enable(
    app: AppHandle,
    state: State<'_, Mutex<ipc::DriverStationState>>,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.enable().await;
    app.emit("is-enabled", app_state.ds.get_enable_status().await)
        .unwrap();
    Ok(())
}

#[tauri::command]
pub async fn disable(
    app: AppHandle,
    state: State<'_, Mutex<ipc::DriverStationState>>,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.disable().await;
    app.emit("is-enabled", app_state.ds.get_enable_status().await)
        .unwrap();
    Ok(())
}

#[tauri::command]
pub async fn get_enabled(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<bool, ()> {
    let mut app_state = state.lock().await;
    Ok(app_state.ds.get_enable_status().await)
}

#[tauri::command]
pub async fn estop(
    app: AppHandle,
    state: State<'_, Mutex<ipc::DriverStationState>>,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.estop().await;
    app.emit("is-enabled", app_state.ds.get_enable_status().await)
        .unwrap();
    app.emit("is-estopped", app_state.ds.estopped).unwrap();
    Ok(())
}

#[tauri::command]
pub async fn get_estopped(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<bool, ()> {
    let app_state = state.lock().await;
    Ok(app_state.ds.estopped)
}

#[tauri::command]
pub async fn update_team_number(
    app: AppHandle,
    state: State<'_, Mutex<ipc::DriverStationState>>,
    team_number: u32,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    let store = app.store("settings.json").unwrap();
    if app_state.ds.team_number != team_number {
        store.set("teamNumber", team_number);
        app_state.ds.update_team_numer(team_number).await;
        store.save().unwrap();
    }
    Ok(())
}

#[tauri::command]
pub async fn get_team_number(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<u32, ()> {
    let mut app_state = state.lock().await;
    Ok(app_state.ds.get_team_number().await)
}

#[tauri::command]
pub async fn update_game_data(
    state: State<'_, Mutex<ipc::DriverStationState>>,
    gsm: String,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.update_game_data(gsm).await;
    Ok(())
}

#[tauri::command]
pub async fn get_game_data(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<String, ()> {
    let mut app_state = state.lock().await;
    Ok(app_state.ds.get_game_data().await)
}

#[tauri::command]
pub async fn use_usb(
    state: State<'_, Mutex<ipc::DriverStationState>>,
    value: bool,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.update_use_usb(value).await;
    Ok(())
}

#[tauri::command]
pub async fn get_usb(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<bool, ()> {
    let mut app_state = state.lock().await;
    Ok(app_state.ds.get_use_usb().await)
}

#[tauri::command]
pub async fn restart_code(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.restart_code().await;
    Ok(())
}

#[tauri::command]
pub async fn restart_roborio(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    app_state.ds.restart_roborio().await;
    Ok(())
}

#[tauri::command]
pub async fn set_mode(
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
    app.emit("mode", mode).unwrap();
    app_state.ds.update_mode(active_mode).await;
    Ok(())
}
#[tauri::command]
pub async fn get_mode(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<u32, ()> {
    let mut app_state = state.lock().await;
    match app_state.ds.get_mode().await {
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
    app.emit("alliance", alliance).unwrap();
    app_state.ds.update_alliance(active_alliance).await;
    Ok(())
}
#[tauri::command]
pub async fn get_alliance(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<u32, ()> {
    let mut app_state = state.lock().await;
    let active_alliance = app_state.ds.get_alliance().await;
    return Ok(
        (active_alliance.position() - 1 + if active_alliance.is_red() { 0 } else { 3 }).into(),
    );
}

#[tauri::command]
pub async fn get_ds_state(state: State<'_, Mutex<ipc::DriverStationState>>) -> Result<Value, ()> {
    let mut app_state = state.lock().await;
    let sim = app_state.ds.get_simulator().await;
    let comms = app_state.ds.get_comms_alive().await;
    let code = app_state.ds.get_code_alive().await;
    let voltage = app_state.ds.get_battery_voltage().await;
    Ok(json!({
        "hasComms": comms || sim,
        "hasCode": code,
        "hasJoysticks": false,
        "isSimulator": sim,
        "batteryVoltage": voltage
    }))
}

#[tauri::command]
pub async fn manage_console(
    app: AppHandle,
    state: State<'_, Mutex<ipc::DriverStationState>>,
    message_type: u32,
) -> Result<(), ()> {
    let mut app_state = state.lock().await;
    let console_message = match message_type {
        0 => ipc::ConsoleMessage::Singular(String::new()),
        1 => ipc::ConsoleMessage::Singular(String::new()),
        2 => ipc::ConsoleMessage::Singular("Console is not displayed when connected to the Simulator. Please check the logs there.".to_string()),
        3 => ipc::ConsoleMessage::Singular("Invalid manage_console call from frontend. Do not call with CONSOLE_MESSAGE from the frontend.".to_string()),
        4 => ipc::ConsoleMessage::Multiple(vec!["The robot controller and driver station are not able to communicate.".to_string(), "1. Check your connection to the robot or it's radio".to_string(), "2. Restart your device, robot controller, or robot radio.".to_string()]),
        5 => ipc::ConsoleMessage::Multiple(vec!["There is no user code running on the robot.".to_string(),"1. Your code may be crashing on startup, check the console for potential errors.".to_string(),"2. There may be no code on the controller. Deploy or re-deploy your code to the controller.".to_string()]),
        6 => ipc::ConsoleMessage::Multiple(vec!["No input devices were found".to_string(),"1. Ensure they are properly connected".to_string(),"2. Disconnect and reconnect any input devices".to_string()]),
        7 => ipc::ConsoleMessage::Singular("Restarting Robot Code".to_string()),
        8 => ipc::ConsoleMessage::Singular("Restarting RoboRIO".to_string()),
        9_u32..=u32::MAX => ipc::ConsoleMessage::Singular("Invalid manage_console call from frontend. Please call with a valid ConsoleMessageType.".to_string()),
    };
    app.emit(
        "console-message",
        ipc::ConsoleOutput::new(console_message.clone(), message_type),
    )
    .unwrap();
    app_state.last_output = ipc::ConsoleOutput::new(console_message, message_type);
    app_state.ds.handle_console(app).await;
    Ok(())
}

#[tauri::command]
pub async fn get_last_console_output(
    state: State<'_, Mutex<ipc::DriverStationState>>,
) -> Result<ipc::ConsoleOutput, ()> {
    let app_state = state.lock().await;
    Ok(app_state.last_output.clone())
}
