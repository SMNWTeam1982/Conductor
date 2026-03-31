use ds::{Alliance, DsMode, Mode};
use tauri::{AppHandle, Emitter};
use tokio::sync::{mpsc, Mutex};

use crate::lib::ipc;

pub struct DriverStation {
    pub team_number: u32,
    pub alliance: Alliance,
    pub mode: Mode,
    pub enabled: bool,
    pub estopped: bool,
    pub game_data: String,
    pub use_usb: bool,
    input_tx: mpsc::Sender<DriverStationCommand>,
    output_rx: Mutex<mpsc::Receiver<DriverStationResponse>>,
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
            mode: Mode::Autonomous,
            enabled: false,
            estopped: false,
            game_data: String::new(),
            use_usb: false,
            input_tx,
            output_rx: Mutex::new(output_rx),
        }
    }
    pub async fn update_team_numer(&mut self, team_number: u32) {
        self.team_number = team_number;
        let _ = self
            .input_tx
            .send(DriverStationCommand::UpdateTeamNumber(team_number))
            .await;
    }
    pub async fn get_team_number(&mut self) -> u32 {
        let _ = self
            .input_tx
            .send(DriverStationCommand::GetTeamNumber)
            .await;
        match self.output_rx.lock().await.recv().await {
            Some(DriverStationResponse::TeamNumber(value)) => value.clone(),
            _ => self.team_number,
        }
    }
    pub async fn update_alliance(&mut self, alliance: Alliance) {
        self.alliance = alliance;
        let _ = self
            .input_tx
            .send(DriverStationCommand::UpdateAlliance(alliance))
            .await;
    }
    pub async fn get_alliance(&mut self) -> Alliance {
        self.alliance
    }
    pub async fn update_mode(&mut self, mode: Mode) {
        self.mode = mode;
        let _ = self
            .input_tx
            .send(DriverStationCommand::UpdateMode(mode))
            .await;
    }
    pub async fn get_mode(&mut self) -> Mode {
        let _ = self.input_tx.send(DriverStationCommand::GetMode).await;
        match self.output_rx.lock().await.recv().await {
            Some(DriverStationResponse::Mode(value)) => value,
            _ => self.mode,
        }
    }
    pub async fn enable(&mut self) -> bool {
        let _ = self.input_tx.send(DriverStationCommand::Enable).await;
        match self.output_rx.lock().await.recv().await {
            Some(DriverStationResponse::Enabled(value)) => value,
            _ => self.enabled,
        }
    }
    pub async fn disable(&mut self) -> bool {
        let _ = self.input_tx.send(DriverStationCommand::Disable).await;
        match self.output_rx.lock().await.recv().await {
            Some(DriverStationResponse::Enabled(value)) => value,
            _ => self.enabled,
        }
    }
    pub async fn get_enable_status(&mut self) -> bool {
        let _ = self.input_tx.send(DriverStationCommand::GetEnabled).await;
        match self.output_rx.lock().await.recv().await {
            Some(DriverStationResponse::Enabled(value)) => value,
            _ => self.enabled,
        }
    }
    pub async fn estop(&mut self) -> bool {
        let _ = self.input_tx.send(DriverStationCommand::Estop).await;
        match self.output_rx.lock().await.recv().await {
            Some(DriverStationResponse::Estopped(value)) => {
                self.estopped = value;
                value
            }
            _ => self.estopped,
        }
    }
    pub async fn update_game_data(&mut self, game_data: String) {
        self.game_data = game_data.clone();
        let _ = self
            .input_tx
            .send(DriverStationCommand::UpdateGameData(game_data))
            .await;
    }
    pub async fn get_game_data(&mut self) -> String {
        self.game_data.clone()
    }
    pub async fn update_use_usb(&mut self, use_usb: bool) {
        self.use_usb = use_usb;
        let _ = self
            .input_tx
            .send(DriverStationCommand::UseUSB(use_usb))
            .await;
    }
    pub async fn get_use_usb(&mut self) -> bool {
        self.use_usb
    }
    pub async fn restart_code(&mut self) {
        let _ = self.input_tx.send(DriverStationCommand::RestartCode).await;
    }
    pub async fn restart_roborio(&mut self) {
        let _ = self
            .input_tx
            .send(DriverStationCommand::RestartRoboRIO)
            .await;
    }
    pub async fn get_comms_alive(&mut self) -> bool {
        let _ = self
            .input_tx
            .send(DriverStationCommand::GetCommsAlive)
            .await;
        match self.output_rx.lock().await.recv().await {
            Some(DriverStationResponse::CommsAlive(value)) => value,
            _ => false,
        }
    }
    pub async fn get_code_alive(&mut self) -> bool {
        let _ = self.input_tx.send(DriverStationCommand::GetCodeAlive).await;
        match self.output_rx.lock().await.recv().await {
            Some(DriverStationResponse::CodeAlive(value)) => value,
            _ => false,
        }
    }
    pub async fn get_simulator(&mut self) -> bool {
        let _ = self.input_tx.send(DriverStationCommand::GetSimulator).await;
        match self.output_rx.lock().await.recv().await {
            Some(DriverStationResponse::Simulator(value)) => value,
            _ => false,
        }
    }
    pub async fn get_battery_voltage(&mut self) -> f32 {
        let _ = self
            .input_tx
            .send(DriverStationCommand::GetBatteryVoltage)
            .await;
        match self.output_rx.lock().await.recv().await {
            Some(DriverStationResponse::BatteryVoltage(value)) => value,
            _ => 0.0,
        }
    }
    pub async fn handle_console(&mut self, app: AppHandle) {
        let _ = self
            .input_tx
            .send(DriverStationCommand::HandleConsole(app.clone()))
            .await;
    }
}

pub enum DriverStationCommand {
    UpdateTeamNumber(u32),
    GetTeamNumber,
    UpdateAlliance(Alliance),
    UpdateMode(Mode),
    GetMode,
    Enable,
    Disable,
    Estop,
    GetEnabled,
    UpdateGameData(String),
    UseUSB(bool),
    RestartCode,
    RestartRoboRIO,
    GetCommsAlive,
    GetCodeAlive,
    GetSimulator,
    GetBatteryVoltage,
    HandleConsole(AppHandle),
}
pub enum DriverStationResponse {
    TeamNumber(u32),
    Mode(Mode),
    Enabled(bool),
    Estopped(bool),
    CommsAlive(bool),
    CodeAlive(bool),
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
                DriverStationCommand::UpdateTeamNumber(team_number) => {
                    ds.set_team_number(team_number);
                }
                DriverStationCommand::GetTeamNumber => {
                    output_tx
                        .send(DriverStationResponse::TeamNumber(ds.team_number()))
                        .await?
                }
                DriverStationCommand::UpdateAlliance(alliance) => ds.set_alliance(alliance),
                DriverStationCommand::UpdateMode(mode) => ds.set_mode(mode),
                DriverStationCommand::GetMode => {
                    output_tx
                        .send(DriverStationResponse::Mode(ds.mode()))
                        .await?
                }
                DriverStationCommand::Enable => {
                    ds.enable();
                    output_tx
                        .send(DriverStationResponse::Enabled(ds.enabled()))
                        .await?
                }
                DriverStationCommand::Disable => {
                    ds.disable();
                    output_tx
                        .send(DriverStationResponse::Enabled(ds.enabled()))
                        .await?
                }
                DriverStationCommand::Estop => {
                    ds.estop();
                    output_tx
                        .send(DriverStationResponse::Estopped(ds.estopped()))
                        .await?
                }
                DriverStationCommand::GetEnabled => {
                    output_tx
                        .send(DriverStationResponse::Enabled(ds.enabled()))
                        .await?
                }
                DriverStationCommand::UpdateGameData(game_data) => {
                    ds.set_game_specific_message(&game_data)?;
                }
                DriverStationCommand::UseUSB(use_usb) => ds.set_use_usb(use_usb),
                DriverStationCommand::RestartCode => ds.restart_code(),
                DriverStationCommand::RestartRoboRIO => ds.restart_roborio(),
                DriverStationCommand::GetCommsAlive => {
                    output_tx
                        .send(DriverStationResponse::CommsAlive(ds.trace().is_connected()))
                        .await?
                }
                DriverStationCommand::GetCodeAlive => {
                    output_tx
                        .send(DriverStationResponse::CodeAlive(
                            ds.trace().is_code_started(),
                        ))
                        .await?
                }
                DriverStationCommand::GetSimulator => {
                    output_tx
                        .send(DriverStationResponse::Simulator(
                            ds.ds_mode() == DsMode::Simulation,
                        ))
                        .await?
                }
                DriverStationCommand::GetBatteryVoltage => {
                    output_tx
                        .send(DriverStationResponse::BatteryVoltage(ds.battery_voltage()))
                        .await?
                }
                DriverStationCommand::HandleConsole(app) => {
                    ds.set_tcp_consumer(move |packet| match packet {
                        ds::TcpPacket::Stdout(stdout) => {
                            let _ = app.emit(
                                "console-message",
                                ipc::ConsoleOutput::new(
                                    ipc::ConsoleMessage::Singular(stdout.message),
                                    3,
                                ),
                            );
                        }
                        ds::TcpPacket::Dummy => (),
                    });
                }
            }
        }
    }
}
