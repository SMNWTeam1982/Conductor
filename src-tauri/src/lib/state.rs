use crate::lib::ipc;
use ds::{Alliance, DriverStation, DsMode, Mode, TcpPacket};
use serde_json::{json, Value};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub fn set_active_page(state: State<Mutex<ipc::AppState>>, page: u32) {
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
pub fn get_active_page(state: State<Mutex<ipc::AppState>>) -> u32 {
    let app_state = state.lock().unwrap();
    let active_page = match app_state.active_page {
        ipc::ActivePage::Overview => 0,
        ipc::ActivePage::Settings => 1,
        ipc::ActivePage::Input => 2,
    };
    return active_page;
}

#[tauri::command]
pub fn enable(app: AppHandle, state: State<Mutex<ipc::DriverStationState>>) {
    let mut app_state = state.lock().unwrap();
    app_state.ds.enable();
    app.emit("is-enabled", app_state.ds.enabled()).unwrap();
}

#[tauri::command]
pub fn disable(app: AppHandle, state: State<Mutex<ipc::DriverStationState>>) {
    let mut app_state = state.lock().unwrap();
    app_state.ds.disable();
    app.emit("is-enabled", app_state.ds.enabled()).unwrap();
}

#[tauri::command]
pub fn estop(app: AppHandle, state: State<Mutex<ipc::DriverStationState>>) {
    let mut app_state = state.lock().unwrap();
    app_state.ds.estop();
    app.emit("is-enabled", app_state.ds.enabled()).unwrap();
    if app_state.ds.trace().is_connected() {
        app.emit("is-estopped", true).unwrap();
    }
}
#[tauri::command]
pub fn update_team_number(state: State<Mutex<ipc::DriverStationState>>, team_number: u32) {
    let mut app_state = state.lock().unwrap();
    if app_state.team_number != team_number {
        app_state.team_number = team_number;
        app_state.ds = DriverStation::new_team(team_number, app_state.alliance);
    }
}

#[tauri::command]
pub fn get_team_number(state: State<Mutex<ipc::DriverStationState>>) -> u32 {
    let app_state = state.lock().unwrap();
    return app_state.team_number;
}

#[tauri::command]
pub fn update_game_data(state: State<Mutex<ipc::DriverStationState>>, gsm: String) {
    let mut app_state = state.lock().unwrap();
    app_state.gsm = gsm.clone();
    app_state.ds.set_game_specific_message(&gsm).unwrap();
}

#[tauri::command]
pub fn get_game_data(state: State<Mutex<ipc::DriverStationState>>) -> String {
    let app_state = state.lock().unwrap();
    return app_state.gsm.clone();
}

#[tauri::command]
pub fn use_usb(state: State<Mutex<ipc::DriverStationState>>, value: bool) {
    let mut app_state = state.lock().unwrap();
    app_state.use_usb = value;
    app_state.ds.set_use_usb(value);
}

#[tauri::command]
pub fn get_usb(state: State<Mutex<ipc::DriverStationState>>) -> bool {
    let app_state = state.lock().unwrap();
    return app_state.use_usb;
}

#[tauri::command]
pub fn restart_code(state: State<Mutex<ipc::DriverStationState>>) {
    let mut app_state = state.lock().unwrap();
    app_state.ds.restart_code();
}

#[tauri::command]
pub fn restart_controller(state: State<Mutex<ipc::DriverStationState>>) {
    let mut app_state = state.lock().unwrap();
    app_state.ds.restart_roborio();
}

#[tauri::command]
pub fn set_mode(app: AppHandle, state: State<Mutex<ipc::DriverStationState>>, mode: u32) {
    let mut app_state = state.lock().unwrap();
    let active_mode = match mode {
        0 => Mode::Autonomous,
        1 => Mode::Teleoperated,
        2 => Mode::Test,
        3_u32..=u32::MAX => unreachable!(),
    };
    app.emit("mode", mode).unwrap();
    app_state.mode = active_mode;
    app_state.ds.set_mode(active_mode);
}
#[tauri::command]
pub fn get_mode(state: State<Mutex<ipc::DriverStationState>>) -> u32 {
    let app_state = state.lock().unwrap();
    return match app_state.mode {
        Mode::Autonomous => 0,
        Mode::Teleoperated => 1,
        Mode::Test => 2,
    };
}

#[tauri::command]
pub fn set_alliance(app: AppHandle, state: State<Mutex<ipc::DriverStationState>>, alliance: u32) {
    let mut app_state = state.lock().unwrap();
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
    app_state.alliance = active_alliance;
    app_state.ds.set_alliance(active_alliance);
}
#[tauri::command]
pub fn get_alliance(state: State<Mutex<ipc::DriverStationState>>) -> u32 {
    let app_state = state.lock().unwrap();
    let active_alliance: Alliance = app_state.alliance;
    return (active_alliance.position() - 1 + if active_alliance.is_red() { 0 } else { 3 }).into();
}

#[tauri::command]
pub fn get_robotstate(state: State<Mutex<ipc::DriverStationState>>) -> Value {
    let app_state = state.lock().unwrap();
    let ds = &app_state.ds;
    let sim = ds.ds_mode() == DsMode::Simulation;
    let comms = ds.trace().is_connected();
    let code = ds.trace().is_code_started();
    let voltage = ds.battery_voltage();
    json!({
        "hasComms": comms || sim,
        "hasCode": code,
        "hasJoysticks": false,
        "isSimulator": sim,
        "batteryVoltage": voltage
    })
}

#[tauri::command]
pub fn manage_console(
    app: AppHandle,
    state: State<Mutex<ipc::DriverStationState>>,
    message_type: u32,
) {
    let mut app_state = state.lock().unwrap();
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
        "stdout-message",
        ipc::ConsoleOutput::new(console_message.clone(), message_type),
    )
    .unwrap();
    app_state.last_output = ipc::ConsoleOutput::new(console_message, message_type);
    app_state.ds.set_tcp_consumer(move |packet| match packet {
        TcpPacket::Stdout(stdout) => {
            app.emit(
                "stdout-message",
                ipc::ConsoleOutput::new(ipc::ConsoleMessage::Singular(stdout.message), 3),
            )
            .unwrap();
        }
        TcpPacket::Dummy => {}
    });
}

#[tauri::command]
pub fn get_last_console_output(state: State<Mutex<ipc::DriverStationState>>) -> ipc::ConsoleOutput {
    let app_state = state.lock().unwrap();
    return app_state.last_output.clone();
}
