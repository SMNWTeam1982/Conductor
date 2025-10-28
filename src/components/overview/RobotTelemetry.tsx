import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { DriverStationState, ConsoleMessageType } from "@lib/ipc-new";
import { successStyle, failStyle } from "@lib/styles";

type ComponentProps = {
    driverStationState: DriverStationState | null;
}

class RobotTelemetry extends React.Component<ComponentProps, any> {
    telemetryBadge(name: string, alive: boolean, messageType: ConsoleMessageType): React.ReactElement {
        let badge;
        if (alive) {
            badge = (
                <span className="badge text-bg-success text-success" style={successStyle}>AA</span>
            )
        } else {
            badge = (
                <span className="badge text-bg-danger text-danger" style={failStyle}
                    onMouseEnter={async () => await invoke("manage_console", { messageType })}
                    onMouseLeave={async () => await invoke("manage_console", { messageType: ConsoleMessageType.CLEAR_CONSOLE })}
                    >AA</span>
            )
        }
        return (
            <li className="list-group-item d-flex justify-content-between align-items-center py-2 user-select-none">
                {name}
                {badge}
            </li>
        )
    }

    render() {
        return (<ul className="list-group mt-4">
            {this.telemetryBadge("Communications", this.props.driverStationState?.hasComms ?? false, ConsoleMessageType.COMMS_ERROR)}
            {this.telemetryBadge("Robot Code", this.props.driverStationState?.hasCode ?? false, ConsoleMessageType.CODE_ERROR)}
            {this.telemetryBadge("Joysticks", this.props.driverStationState?.hasJoysticks ?? false, ConsoleMessageType.JOYSTICK_ERROR)}
        </ul>)
    }
}

export default RobotTelemetry;