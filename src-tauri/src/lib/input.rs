use tauri::{AppHandle, Emitter, State};
use gilrs::{Gilrs, Gamepad, GamepadId};
use serde_json::json;
use std::sync::{Mutex, Arc};
use uuid::Uuid;
use crate::lib::{ipc, state};

#[tauri::command]
pub fn has_joysticks(state: State<Mutex<ipc::JoystickState>>) -> bool {
    let joystick_state = state.lock().unwrap();
    !joystick_state.gamepads.is_empty()
}

#[tauri::command]
pub fn add_mapping(state: State<Mutex<ipc::JoystickState>>, name: Uuid, pos: usize) {
    let mut joystick_state = state.lock().unwrap();
    joystick_state.mappings.insert(name, pos);
}

#[tauri::command]
pub fn update_mappings(app: AppHandle, state: State<Mutex<ipc::JoystickState>>) {
    let mut joystick_state = state.lock().unwrap();
    joystick_state.gil.next_event();
    let new_gamepads = joystick_state.gil.gamepads().any(|(id, _)| !joystick_state.gamepads.iter().any(|gp| gp.gid == id));
    let removed_gamepads = joystick_state.gamepads.iter().any(|gp| !joystick_state.gil.gamepad(gp.gid).is_connected());
    if new_gamepads {
        // for (id, gp) in connected_gamepads.iter().filter(|(id, _)| !existing_gamepads.iter().any(|gamepad| gamepad.gid == *id)) {
        //     let gamepad_id = Uuid::new_v4();
        //     app.emit("joystick-update", json!({ "removed": false, "name": gp.name(), "uuid": gamepad_id})).unwrap();
        //     joystick_state.gamepads.push(ipc::GamepadData {assigned_id: gamepad_id, gid: *id, name: gp.name().to_string()});
        // }
    }
    if removed_gamepads {
        // for (i, gp) in joystick_state.gamepads.clone().into_iter().enumerate() {
        //     if joystick_state.gil.gamepad(gp.gid).is_connected() {
        //         continue;
        //     }
        //     joystick_state.gamepads.remove(i);
        //     app.emit("joystick-update", json!({ "removed": true, "name": gp.name.to_string(), "uuid": gp.gid.to_string()})).unwrap();
        // }
    }
}