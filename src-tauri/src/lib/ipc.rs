use crate::lib::backend;
use gilrs::{GamepadId, Gilrs};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::mpsc;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActivePage {
    Overview,
    Settings,
    Input,
}

pub struct AppState {
    pub active_page: ActivePage,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            active_page: ActivePage::Overview,
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(untagged)]
pub enum ConsoleMessage {
    Singular(String),
    Multiple(Vec<String>),
    None,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ConsoleMessageType {
    NoOutput,
    ClearConsole,
    SimulationMessage,
    ConsoleMessage,
    CommsError,
    CodeError,
    JoystickError,
    RestartCode,
    RestartRobot,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ConsoleOutput {
    pub message_content: ConsoleMessage,
    pub message_type: u32,
    pub message_name: ConsoleMessageType,
    pub clear_console: bool,
}

impl ConsoleOutput {
    pub fn new(message: ConsoleMessage, message_type: u32) -> Self {
        let (returned_type, clear) = match message_type {
            0 => (ConsoleMessageType::NoOutput, false),
            1 => (ConsoleMessageType::ClearConsole, true),
            2 => (ConsoleMessageType::SimulationMessage, true),
            3 => (ConsoleMessageType::ConsoleMessage, false),
            4 => (ConsoleMessageType::CommsError, true),
            5 => (ConsoleMessageType::CodeError, true),
            6 => (ConsoleMessageType::JoystickError, true),
            7 => (ConsoleMessageType::RestartCode, false),
            8 => (ConsoleMessageType::RestartRobot, false),
            9_u32..=u32::MAX => (ConsoleMessageType::NoOutput, false),
        };
        ConsoleOutput {
            message_content: message,
            message_type: message_type,
            message_name: returned_type,
            clear_console: clear,
        }
    }
}

pub struct DriverStationState {
    pub ds: backend::DriverStation,
    pub has_joysticks: bool,
    pub last_output: ConsoleOutput,
}

impl DriverStationState {
    pub fn new(
        team_number: u32,
        command_sender: mpsc::Sender<backend::DriverStationCommand>,
        response_reciever: mpsc::Receiver<backend::DriverStationResponse>,
    ) -> Self {
        DriverStationState {
            ds: backend::DriverStation::new(team_number, command_sender, response_reciever),
            has_joysticks: false,
            last_output: ConsoleOutput::new(ConsoleMessage::Singular(String::new()), 1),
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct GamepadData {
    pub assigned_id: Uuid,
    pub gid: GamepadId,
    pub name: String,
}

// pub struct JoystickUpdate {
//     removed: bool,
//     name: String,
//     uuid: String,
// }

pub struct JoystickState {
    pub gil: Gilrs,
    pub gamepads: Vec<GamepadData>,
    pub mappings: HashMap<Uuid, usize>,
}

impl JoystickState {
    pub fn new() -> JoystickState {
        JoystickState {
            gil: Gilrs::new().unwrap(),
            gamepads: Vec::new(),
            mappings: HashMap::new(),
        }
    }
}
// pub fn update(&mut self) {
//     self.gil.next_event();

//     let new_gamepads = self
//         .gil
//         .gamepads()
//         .any(|(id, _)| !self.gamepads.iter().any(|gp| gp.gid == id));
//     let removed_gamepads = self
//         .gamepads
//         .iter()
//         .any(|gp| !self.gil.gamepad(gp.gid).is_connected());

//     if new_gamepads {
//         let gp = self.gamepads.clone();
//         for (id, gp) in self
//             .gil
//             .gamepads()
//             .filter(|(id, _)| !gp.iter().any(|gp| gp.gid == *id))
//         {
//             let gamepad_id = Uuid::new_v4();
//             let msg = JoystickUpdate {
//                 removed: false,
//                 name: gp.name().to_string(),
//                 uuid: gamepad_id.to_string(),
//             };
//             // self.addr.do_send(msg);
//             let data = GamepadData {
//                 assigned_id: gamepad_id,
//                 gid: id,
//                 name: gp.name().to_string(),
//             };
//             self.gamepads.push(data);
//         }
//     }

//     if removed_gamepads {
//         for (i, gp) in self.gamepads.clone().into_iter().enumerate() {
//             if self.gil.gamepad(gp.gid).is_connected() {
//                 continue;
//             }
//             self.gamepads.remove(i);
//             let msg = JoystickUpdate {
//                 removed: true,
//                 uuid: gp.assigned_id.to_string(),
//                 name: gp.name,
//             };
//             // self.addr.do_send(msg);
//         }
//         self.apply_joystick_safety();
//     }
// }

// fn apply_joystick_safety(&self) {
//     // let msg = UpdateEnableStatus {
//     //     enabled: false,
//     //     from_backend: true,
//     // };
//     // self.addr.do_send(msg);
// }

// fn map_gid(&self, id: GamepadId) -> Option<Uuid> {
//     self.gamepads
//         .iter()
//         .find(|gp| gp.gid == id)
//         .map(|gp| gp.assigned_id)
// }
