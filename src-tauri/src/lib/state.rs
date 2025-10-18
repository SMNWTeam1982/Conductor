use ds::{Alliance, DriverStation, DsMode, Mode, TcpPacket};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActivePage {
    Control,
    Config,
    Joysticks,
}

pub struct AppState {
    pub active_page: ActivePage,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            active_page: ActivePage::Control,
        }
    }
    pub fn set_active_page(&mut self, page: ActivePage) {
        self.active_page = page;
    }
}

#[tauri::command]
pub fn set_active_page(app: AppHandle, state: State<Mutex<AppState>>, page: u32) {
    let mut app_state = state.lock().unwrap();
    let active_page = match page {
        0 => ActivePage::Control,
        1 => ActivePage::Config,
        2 => ActivePage::Joysticks,
        3_u32..=u32::MAX => todo!(),
    };
    app.emit("current-page", page).unwrap();
    app_state.set_active_page(active_page);
}

pub struct DsState {
    pub ds: DriverStation,
    pub mode: Mode,
    pub alliance: Alliance,
    pub has_joysticks: bool,
}

impl DsState {
    pub fn new() -> Self {
        let ds = DriverStation::new_team(1982, Alliance::new_red(1));
        DsState {
            ds,
            mode: Mode::Autonomous,
            alliance: Alliance::new_red(1),
            has_joysticks: false,
        }
    }
    pub fn update_team_number(&mut self, team_number: u32) {
        self.ds.set_team_number(team_number);
    }

    pub fn get_enabled(&mut self) -> bool {
        return self.ds.enabled();
    }

    pub fn enable(&mut self) {
        self.ds.enable();
    }

    pub fn disable(&mut self) {
        self.ds.disable();
    }

    pub fn estop(&mut self) {
        self.ds.estop();
    }

    pub fn set_mode(&mut self, mode: Mode) {
        self.mode = mode;
        self.ds.set_mode(self.mode);
    }

    pub fn set_alliance(&mut self, alliance: Alliance) {
        self.alliance = alliance;
        self.ds.set_alliance(alliance);
    }
}

#[tauri::command]
pub fn update_team_number(state: State<Mutex<DsState>>, team_number: u32) {
    let mut app_state = state.lock().unwrap();
    app_state.update_team_number(team_number);
}

#[tauri::command]
pub fn get_team_number(state: State<Mutex<DsState>>) -> u32 {
    let app_state = state.lock().unwrap();
    return app_state.ds.team_number();
}

#[tauri::command]
pub fn enable(app: AppHandle, state: State<Mutex<DsState>>) {
    let mut app_state = state.lock().unwrap();
    app_state.enable();
    app.emit("is-enabled", app_state.get_enabled()).unwrap();
}

#[tauri::command]
pub fn disable(app: AppHandle, state: State<Mutex<DsState>>) {
    let mut app_state = state.lock().unwrap();
    app_state.disable();
    app.emit("is-enabled", app_state.get_enabled()).unwrap();
}

#[tauri::command]
pub fn estop(app: AppHandle, state: State<Mutex<DsState>>) {
    let mut app_state = state.lock().unwrap();
    app_state.estop();
    app.emit("is-enabled", app_state.get_enabled()).unwrap();
    let _ = app.emit("is-estopped", true);
}

#[tauri::command]
pub fn set_mode(app: AppHandle, state: State<Mutex<DsState>>, mode: u32) {
    let mut app_state = state.lock().unwrap();
    let active_mode = match mode {
        0 => Mode::Autonomous,
        1 => Mode::Teleoperated,
        2 => Mode::Test,
        3_u32..=u32::MAX => todo!(),
    };
    app.emit("mode", mode).unwrap();
    app_state.set_mode(active_mode);
}
#[tauri::command]
pub fn get_mode(state: State<Mutex<DsState>>) -> u32 {
    let app_state = state.lock().unwrap();
    return match app_state.mode {
        Mode::Autonomous => 0,
        Mode::Teleoperated => 1,
        Mode::Test => 2,
    };
}

#[tauri::command]
pub fn set_alliance(app: AppHandle, state: State<Mutex<DsState>>, alliance: u32) {
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
    app_state.set_alliance(active_alliance);
}
#[tauri::command]
pub fn get_alliance(state: State<Mutex<DsState>>) -> u32 {
    let app_state = state.lock().unwrap();
    let active_alliance: Alliance = app_state.alliance;
    return (active_alliance.position() - 1 + if active_alliance.is_red() { 0 } else { 3 }).into();
}

#[tauri::command]
pub fn get_robotstate(state: State<Mutex<DsState>>) -> Value {
    let app_state = state.lock().unwrap();
    let ds = &app_state.ds;
    let sim = ds.ds_mode() == DsMode::Simulation;
    let mut comms = ds.trace().is_connected();
    if sim {
        comms = true;
    };
    let code = ds.trace().is_code_started();
    let voltage = ds.battery_voltage();
    let current_state = json!({
        "commsAlive": comms,
        "codeAlive": code,
        "voltage": voltage,
        "joysticksConnected": false,
        "simulatorConnected": sim
    });
    return current_state;
}

#[tauri::command]
pub fn start_stdout(app: AppHandle, state: State<Mutex<DsState>>) {
    let mut app_state = state.lock().unwrap();
    let ds = &mut app_state.ds;
    ds.set_tcp_consumer(move |packet| match packet {
            TcpPacket::Stdout(stdout) => {
                app.emit("stdout-message", stdout.message).unwrap()
            }
            TcpPacket::Dummy => {}
        });
}