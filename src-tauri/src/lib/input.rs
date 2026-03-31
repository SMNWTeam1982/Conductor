use crate::lib::ipc;
use ds::JoystickValue;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};
use uuid::Uuid;

#[tauri::command]
pub fn has_joysticks(state: State<Mutex<ipc::InputState>>) -> bool {
    let joystick_state = state.lock().unwrap();
    !joystick_state.devices.is_empty()
}

#[tauri::command]
pub fn add_mapping(state: State<Mutex<ipc::InputState>>, name: Uuid, pos: usize) {
    let mut joystick_state = state.lock().unwrap();
    joystick_state.mappings.insert(name, pos);
}

#[tauri::command]
pub fn emit_inputs(app: AppHandle, state: State<Mutex<ipc::InputState>>) {
    let joystick_state = state.lock().unwrap();
    app.emit("input-item", joystick_state.devices.clone())
        .unwrap();
}

#[tauri::command]
pub fn update_mappings(app: AppHandle, state: State<Mutex<ipc::InputState>>) {
    // let mut joystick_state = state.lock().unwrap();
    // joystick_state.gil.next_event();
    // let new_gamepads = joystick_state
    //     .gil
    //     .gamepads()
    //     .any(|(id, _)| !joystick_state.devices.iter().any(|gp| gp.device_id == id));
    // let removed_gamepads = joystick_state
    //     .devices
    //     .iter()
    //     .any(|gp| !joystick_state.gil.gamepad(Some(gp.device_id)).is_connected());
    // for (gp) in joystick_state.devices.iter() {
    //     println!("{:#?}", gp.name)
    // }

    // if removed_gamepads {
    //     // for (i, gp) in joystick_state.gamepads.clone().into_iter().enumerate() {
    //     //     if joystick_state.gil.gamepad(gp.gid).is_connected() {
    //     //         continue;
    //     //     }
    //     //     joystick_state.gamepads.remove(i);
    //     //     app.emit("joystick-update", json!({ "removed": true, "name": gp.name.to_string(), "uuid": gp.gid.to_string()})).unwrap();
    //     // }
    // }
}

#[tauri::command]
pub fn joystick_callback(state: State<Mutex<ipc::InputState>>) -> Vec<Vec<JoystickValue>> {
    let mut input_state = state.lock().unwrap();
    let gil = &input_state.gil;
    let mappings = &input_state.mappings;

    Vec::new()
    // if gil.gamepads().count() == 0 {

    // }
}