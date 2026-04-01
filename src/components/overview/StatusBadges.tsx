import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { DriverStationState } from "@lib/ipc";
import { successStyle, failStyle } from "@lib/styles";

type ComponentProps = {
    driverStationState: DriverStationState | undefined;
}

class StatusBadges extends React.Component<ComponentProps, any> {
    commsError = [
        "The robot controller and driver station are not able to communicate.", 
        "1. Check your connection to the robot or it's radio", 
        "2. Restart your device, robot controller, or robot radio."
    ]
    codeError = [
        "There is no user code running on the robot.",
        "1. Your code may be crashing on startup, check the console for potential errors.",
        "2. There may be no code on the controller. Deploy or re-deploy your code to the controller."
    ]
    inputError = [
        "No input devices were found",
        "1. Ensure your controllers are properly connected",
        "2. Disconnect and reconnect any input devices"
    ]
    statusBadge(name: string, alive: boolean, errorMessage: string[]): React.ReactElement {
        let badge;
        if (alive) {
            badge = (
                <span className="badge text-bg-success text-success" style={successStyle}>AA</span>
            )
        } else {
            badge = (
                <span className="badge text-bg-danger text-danger" style={failStyle}
                    onMouseEnter={async () => await invoke("console_action", { action: { type: "appendMany", lines: errorMessage, frontendAction: true } })}
                    onMouseLeave={async () => await invoke("console_action", { action: { type: "clear", frontendAction: true } })}
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
            {this.statusBadge("Communications", this.props.driverStationState?.hasComms ?? false, this.commsError)}
            {this.statusBadge("Robot Code", this.props.driverStationState?.hasCode ?? false, this.codeError)}
            {this.statusBadge("Joysticks", this.props.driverStationState?.hasJoysticks ?? false, this.inputError)}
        </ul>)
    }
}

export default StatusBadges;