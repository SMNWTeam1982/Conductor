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

pub struct DriverStationState {
    pub ds: backend::DriverStation,
    pub has_joysticks: bool,
}

impl DriverStationState {
    pub fn new(
        team_number: u32,
        command_sender: mpsc::Sender<backend::DriverStationCommand>,
        response_receiver: mpsc::Receiver<backend::DriverStationResponse>,
    ) -> Self {
        DriverStationState {
            ds: backend::DriverStation::new(team_number, command_sender, response_receiver),
            has_joysticks: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum ConsoleAction {
    Append { 
        line: String,
        #[serde(default, alias = "frontendAction")]
        frontend_action: bool 
    },
    AppendMany { 
        lines: Vec<String>,
        #[serde(default, alias = "frontendAction")]
        frontend_action: bool 
    },
    Clear { 
        #[serde(default, alias = "frontendAction")]
        frontend_action: bool 
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum ConsoleEvent {
    Appended { 
        lines: Vec<String>,
        #[serde(default, alias = "frontendAction")]
        frontend_action: bool 
    },
    Cleared { 
        #[serde(default, alias = "frontendAction")]
        frontend_action: bool 
    },
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InputDevice {
    pub unique_id: Uuid,
    pub device_id: Option<GamepadId>,
    pub name: String,
}
pub struct InputState {
    pub gil: Gilrs,
    pub devices: Vec<InputDevice>,
    pub mappings: HashMap<Uuid, usize>,
}

impl InputState {
    pub fn new() -> InputState {
        let mut devices = Vec::new();
        devices.push(InputDevice {
            unique_id: Uuid::nil(),
            name: "Virtual Joystick".to_string(),
            device_id: None,
        });
        InputState {
            gil: Gilrs::new().unwrap(),
            devices: devices,
            mappings: HashMap::new(),
        }
    }
    pub fn has_input(&self) -> bool {
        !self.devices.is_empty()
    }
    pub fn add_mapping(&mut self, id: Uuid, position: usize) {
        self.mappings.insert(id, position);
    }
    pub fn update(&mut self) {
        self.gil.next_event();

        let new_devices = self
            .gil
            .gamepads()
            .any(|(id, _)| !self.devices.iter().any(|gp| gp.device_id == Some(id)));
        let removed_devices = self
            .devices
            .iter()
            .filter_map(|dev| dev.device_id)
            .any(|id| !self.gil.gamepad(id).is_connected());
        if new_devices {
            let dev = self.devices.clone();
            for (dev_id, dev) in self
                .gil
                .gamepads()
                .filter(|(id, _)| !dev.iter().any(|dev| dev.device_id == Some(*id)))
            {
                let unique_id = Uuid::new_v4();
                let device = InputDevice {
                    unique_id,
                    device_id: Some(dev_id),
                    name: dev.name().to_string(),
                };
                self.devices.push(device);
            }
        }
        if removed_devices {
            for (pos, dev) in self.devices.clone().into_iter().enumerate() {
                if let Some(id) = dev.device_id {
                    if self.gil.gamepad(id).is_connected() {
                        continue;
                    }
                }
                self.devices.remove(pos);
            }
        }
    }
    pub fn device_id_to_uuid(&self, device_id: GamepadId) -> Option<Uuid> {
        self.devices
            .iter()
            .find(|dev| dev.device_id == Some(device_id))
            .map(|dev| dev.unique_id)
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InputUpdate {
    pub device: InputDevice,
    pub removed: bool,
    pub mapping: HashMap<bool, u32>,
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
