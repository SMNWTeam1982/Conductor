// This file contains types for the state exposed by the state.rs file in the Tauri backend.
// These are used to ensure state within the app is always accurate, and never an unexpected value

/**
 * Represents the selected page in the Driver Station Window
 */
export enum ActivePage {
    Overview,
    Settings,
    Input
}

/**
 * Represents the mode of the robot
 */
export enum ControlMode {
    Autonomous,
    Teleoperated,
    Test
}

/**
 * Represents the color of an Alliance
 */
export enum AllianceColor {
    Red,
    Blue
}

/**
 * Represents the position within the Alliance
 */
export enum AlliancePosition {
    One,
    Two,
    Three
}

/**
 * Represents a given Alliance composed of it's color and position
 */
export interface Alliance {
    color: AllianceColor;
    position: AlliancePosition;
}

/**
 * Represents the global Driver Station State
 */
export interface DriverStationState {
    hasComms: boolean;
    hasCode: boolean;
    hasJoysticks: boolean;
    isSimulator: boolean;
    batteryVoltage: number;
}

/**
 * Represents a console manager command for the stdout window.
 */
export enum ConsoleMessageType {
    NO_OUTPUT,
    CLEAR_CONSOLE,
    SIMULATION_MESSAGE,
    CONSOLE_MESSAGE,
    COMMS_ERROR,
    CODE_ERROR,
    JOYSTICK_ERROR,
    RESTART_CODE,
    RESTART_ROBOT,
}

/**
 * Represents a Console Output event
 */
export interface ConsoleOutput {
    messageContent: string | string[];
    messageType: ConsoleMessageType;
    messageName: string;
    clearConsole: boolean;
}


/**
 * Represents an abstract Input device with unique and (potentially) non-unique identifiers
 */
export interface InputDevice {
    uniqueId: string;
    deviceId: number;
    name: string;
}

/**
 * Represents the backend state of connected Input devices
 */
export interface InputState {
    devices: InputDevice[],
    mappings: {
        uuid: string;
        position: number;
    }[]
}

/**
 * Represents an event fired when an Input device is updated
 */
export interface InputUpdate {
    device: InputDevice
    removed: boolean;
    mapping: {
        updated: boolean;
        position: number;
    }
}