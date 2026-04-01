use std::time::Duration;

use ds::{Alliance, DsMode, Mode};
use tauri::{AppHandle, Emitter};
use tauri_plugin_store::StoreExt;
use tokio::{
    sync::{mpsc, oneshot, Mutex},
    time::timeout,
};

use crate::lib::ipc;

pub struct DriverStation {
    pub team_number: u32,
    pub alliance: Alliance,
    pub drive_mode: Mode,
    pub enabled: bool,
    pub estopped: bool,
    pub game_data: String,
    pub use_usb: bool,
    pub last_console_output: ipc::ConsoleEvent,
    input_tx: mpsc::Sender<DriverStationCommand>,
    output_rx: Mutex<mpsc::Receiver<DriverStationResponse>>,
    response_timeout: Duration,
}

impl DriverStation {
    pub fn new(
        team_number: u32,
        input_tx: mpsc::Sender<DriverStationCommand>,
        output_rx: mpsc::Receiver<DriverStationResponse>,
    ) -> Self {
        DriverStation {
            team_number,
            alliance: Alliance::new_red(1),
            drive_mode: Mode::Autonomous,
            enabled: false,
            estopped: false,
            game_data: String::new(),
            use_usb: false,
            last_console_output: ipc::ConsoleEvent::Cleared {
                frontend_action: false,
            },
            input_tx,
            output_rx: Mutex::new(output_rx),
            response_timeout: Duration::from_millis(120),
        }
    }
    async fn recv_response(&self) -> Option<DriverStationResponse> {
        let mut rx = self.output_rx.lock().await;
        match timeout(self.response_timeout, rx.recv()).await {
            Ok(response) => response,
            Err(_) => None
        }
    }
    pub async fn set_team_number(&mut self, app: AppHandle, team_number: u32) {
        self.team_number = team_number;
        let store = app.store("settings.json").unwrap();
        store.set("teamNumber", self.team_number);
        let _ = store.save();
        let _ = self
            .input_tx
            .send(DriverStationCommand::SetTeamNumber(self.team_number))
            .await;
    }
    pub async fn get_team_number(&mut self, app: AppHandle) -> u32 {
        let store = app.store("settings.json").unwrap();

        if let Some(stored_team_number) = store
            .get("teamNumber")
            .and_then(|stored_team_number| stored_team_number.as_u64())
        {
            self.team_number = stored_team_number as u32;
        }

        let (tx, rx) = oneshot::channel();
        let _ = self
            .input_tx
            .send(DriverStationCommand::GetTeamNumber(tx))
            .await;
        match tokio::time::timeout(self.response_timeout, rx).await {
            Ok(Ok(DriverStationResponse::TeamNumber(value))) => value,
            _ => self.team_number,
        }
    }
    pub async fn set_alliance(&mut self, alliance: Alliance) {
        self.alliance = alliance;
        let _ = self
            .input_tx
            .send(DriverStationCommand::SetAlliance(alliance))
            .await;
    }
    pub async fn get_alliance(&mut self) -> Alliance {
        self.alliance
    }
    pub async fn set_drive_mode(&mut self, mode: Mode) {
        self.drive_mode = mode;
        let _ = self
            .input_tx
            .send(DriverStationCommand::SetDriveMode(mode))
            .await;
    }
    pub async fn get_drive_mode(&mut self) -> Mode {
        let (tx, rx) = oneshot::channel();
        let _ = self
            .input_tx
            .send(DriverStationCommand::GetDriveMode(tx))
            .await;
        match tokio::time::timeout(self.response_timeout, rx).await {
            Ok(Ok(DriverStationResponse::DriveMode(value))) => value,
            _ => self.drive_mode,
        }
    }
    pub async fn set_enabled(&mut self) {
        let _ = self.input_tx.send(DriverStationCommand::SetEnabled).await;
        self.enabled = match self.recv_response().await {
            Some(DriverStationResponse::Enabled(value)) => value,
            _ => self.enabled,
        };
    }
    pub async fn set_disabled(&mut self) {
        let _ = self.input_tx.send(DriverStationCommand::SetDisabled).await;
        self.enabled = match self.recv_response().await {
            Some(DriverStationResponse::Enabled(value)) => value,
            _ => self.enabled,
        };
    }
    pub async fn get_enable_status(&mut self) -> bool {
        let (tx, rx) = oneshot::channel();
        let _ = self
            .input_tx
            .send(DriverStationCommand::GetEnableStatus(tx))
            .await;
        match tokio::time::timeout(self.response_timeout, rx).await {
            Ok(Ok(DriverStationResponse::Enabled(value))) => value,
            _ => false,
        }
    }
    pub async fn set_estopped(&mut self) -> bool {
        let _ = self.input_tx.send(DriverStationCommand::SetEstopped).await;
        match self.recv_response().await {
            Some(DriverStationResponse::Estopped(value)) => value,
            _ => self.estopped,
        }
    }
    pub async fn get_estopped(&mut self) -> bool {
        let (tx, rx) = oneshot::channel();
        let _ = self
            .input_tx
            .send(DriverStationCommand::GetEstopped(tx))
            .await;
        match tokio::time::timeout(self.response_timeout, rx).await {
            Ok(Ok(DriverStationResponse::Estopped(value))) => value,
            _ => false,
        }
    }
    pub async fn set_game_data(&mut self, game_data: String) {
        self.game_data = game_data.clone();
        let _ = self
            .input_tx
            .send(DriverStationCommand::SetGameData(game_data))
            .await;
    }
    pub async fn get_game_data(&mut self) -> String {
        self.game_data.clone()
    }
    pub async fn set_usb_conn(&mut self, use_usb: bool) {
        self.use_usb = use_usb;
        let _ = self
            .input_tx
            .send(DriverStationCommand::SetUSBConn(use_usb))
            .await;
    }
    pub async fn get_usb_conn(&mut self) -> bool {
        self.use_usb
    }
    pub async fn restart_code(&mut self) {
        let _ = self.input_tx.send(DriverStationCommand::RestartCode).await;
    }
    pub async fn restart_rio(&mut self) {
        let _ = self
            .input_tx
            .send(DriverStationCommand::RestartRoboRIO)
            .await;
    }
    pub async fn get_comms_status(&mut self) -> bool {
        let (tx, rx) = oneshot::channel();
        let _ = self
            .input_tx
            .send(DriverStationCommand::GetCommsStatus(tx))
            .await;
        match tokio::time::timeout(self.response_timeout, rx).await {
            Ok(Ok(DriverStationResponse::CommsStatus(value))) => value,
            _ => false,
        }
    }
    pub async fn get_code_status(&mut self) -> bool {
        let (tx, rx) = oneshot::channel();
        let _ = self
            .input_tx
            .send(DriverStationCommand::GetCodeStatus(tx))
            .await;
        match tokio::time::timeout(self.response_timeout, rx).await {
            Ok(Ok(DriverStationResponse::CodeStatus(value))) => value,
            _ => false,
        }
    }
    pub async fn get_simulator(&mut self) -> bool {
        let (tx, rx) = oneshot::channel();
        let _ = self
            .input_tx
            .send(DriverStationCommand::GetSimulator(tx))
            .await;
        match tokio::time::timeout(self.response_timeout, rx).await {
            Ok(Ok(DriverStationResponse::Simulator(value))) => value,
            _ => false,
        }
    }
    pub async fn get_battery_voltage(&mut self) -> f32 {
        let (tx, rx) = oneshot::channel();
        let _ = self
            .input_tx
            .send(DriverStationCommand::GetBatteryVoltage(tx))
            .await;
        match tokio::time::timeout(self.response_timeout, rx).await {
            Ok(Ok(DriverStationResponse::BatteryVoltage(value))) => value,
            _ => 0.0,
        }
    }

    pub async fn handle_console_init(&mut self, app: AppHandle) {
        let _ = self
            .input_tx
            .send(DriverStationCommand::InitRobotConsole(app.clone()))
            .await;
    }
    pub async fn handle_console_action(
        &mut self,
        app: AppHandle,
        action: ipc::ConsoleAction,
    ) -> Result<(), ()> {
        match action {
            ipc::ConsoleAction::Clear { frontend_action } => {
                self.last_console_output = ipc::ConsoleEvent::Cleared { frontend_action };
                app.emit("consoleEvent", self.last_console_output.clone())
                    .map_err(|_| ())?;
            }
            ipc::ConsoleAction::Append {
                line,
                frontend_action,
            } => {
                self.last_console_output = ipc::ConsoleEvent::Appended {
                    lines: vec![line],
                    frontend_action,
                };
                app.emit("consoleEvent", self.last_console_output.clone())
                    .map_err(|_| ())?;
            }
            ipc::ConsoleAction::AppendMany {
                lines,
                frontend_action,
            } => {
                self.last_console_output = ipc::ConsoleEvent::Appended {
                    lines,
                    frontend_action,
                };
                app.emit("consoleEvent", self.last_console_output.clone())
                    .map_err(|_| ())?;
            }
        }
        Ok(())
    }
}

pub enum DriverStationCommand {
    SetTeamNumber(u32),
    GetTeamNumber(oneshot::Sender<DriverStationResponse>),
    SetAlliance(Alliance),
    SetDriveMode(Mode),
    GetDriveMode(oneshot::Sender<DriverStationResponse>),
    SetEnabled,
    SetDisabled,
    GetEnableStatus(oneshot::Sender<DriverStationResponse>),
    SetEstopped,
    GetEstopped(oneshot::Sender<DriverStationResponse>),
    SetGameData(String),
    SetUSBConn(bool),
    RestartCode,
    RestartRoboRIO,
    GetCommsStatus(oneshot::Sender<DriverStationResponse>),
    GetCodeStatus(oneshot::Sender<DriverStationResponse>),
    GetSimulator(oneshot::Sender<DriverStationResponse>),
    GetBatteryVoltage(oneshot::Sender<DriverStationResponse>),
    InitRobotConsole(AppHandle),
}
pub enum DriverStationResponse {
    TeamNumber(u32),
    DriveMode(Mode),
    Enabled(bool),
    Estopped(bool),
    CommsStatus(bool),
    CodeStatus(bool),
    Simulator(bool),
    BatteryVoltage(f32),
}

pub async fn driver_station_thread(
    mut input_rx: mpsc::Receiver<DriverStationCommand>,
    output_tx: mpsc::Sender<DriverStationResponse>,
    team_number: u32,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut ds = ds::DriverStation::new_team(team_number, Alliance::new_red(1));
    loop {
        while let Some(command) = input_rx.recv().await {
            match command {
                DriverStationCommand::SetTeamNumber(team_number) => {
                    ds.set_team_number(team_number);
                }
                DriverStationCommand::GetTeamNumber(responder) => {
                    let _ = responder.send(DriverStationResponse::TeamNumber(
                        ds.team_number(),
                    ));
                }
                DriverStationCommand::SetAlliance(alliance) => ds.set_alliance(alliance),
                DriverStationCommand::SetDriveMode(mode) => ds.set_mode(mode),
                DriverStationCommand::GetDriveMode(responder) => {
                    let _ = responder.send(DriverStationResponse::DriveMode(
                        ds.mode(),
                    ));
                }
                DriverStationCommand::SetEnabled => {
                    ds.enable();
                    output_tx
                        .send(DriverStationResponse::Enabled(ds.enabled()))
                        .await?
                }
                DriverStationCommand::SetDisabled => {
                    ds.disable();
                    output_tx
                        .send(DriverStationResponse::Enabled(ds.enabled()))
                        .await?
                }
                DriverStationCommand::GetEnableStatus(responder) => {
                    let _ = responder.send(DriverStationResponse::Enabled(
                        ds.enabled(),
                    ));
                }
                DriverStationCommand::SetEstopped => {
                    ds.estop();
                    output_tx
                        .send(DriverStationResponse::Estopped(ds.estopped()))
                        .await?
                }
                DriverStationCommand::GetEstopped(responder) => {
                    let _ = responder.send(DriverStationResponse::Estopped(
                        ds.estopped(),
                    ));
                }
                DriverStationCommand::SetGameData(game_data) => {
                    ds.set_game_specific_message(&game_data)?;
                }
                DriverStationCommand::SetUSBConn(use_usb) => ds.set_use_usb(use_usb),
                DriverStationCommand::RestartCode => ds.restart_code(),
                DriverStationCommand::RestartRoboRIO => ds.restart_roborio(),
                DriverStationCommand::GetCommsStatus(responder) => {
                    let _ = responder.send(DriverStationResponse::CommsStatus(
                        ds.trace().is_connected(),
                    ));
                }
                DriverStationCommand::GetCodeStatus(responder) => {
                    let _ = responder.send(DriverStationResponse::CodeStatus(
                        ds.trace().is_code_started(),
                    ));
                }
                DriverStationCommand::GetSimulator(responder) => {
                    let _ = responder.send(DriverStationResponse::Simulator(
                        ds.ds_mode() == DsMode::Simulation,
                    ));
                }
                DriverStationCommand::GetBatteryVoltage(responder) => {
                    let _ = responder.send(DriverStationResponse::BatteryVoltage(
                        ds.battery_voltage(),
                    ));
                }
                DriverStationCommand::InitRobotConsole(app) => {
                    ds.set_tcp_consumer(move |packet| match packet {
                        ds::TcpPacket::Stdout(stdout) => {
                            let _ = app.emit(
                                "consoleEvent",
                                ipc::ConsoleEvent::Appended {
                                    lines: vec![stdout.message],
                                    frontend_action: false,
                                },
                            );
                        }
                        ds::TcpPacket::Dummy => (),
                    });
                }
            }
        }
    }
}
