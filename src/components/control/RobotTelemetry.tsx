import React from "react";
import { ErrorExplanation, RobotState } from "@lib/store";
import { invoke } from "@tauri-apps/api/core";


export const successStyle = {
    color: "#00BC8C"
}

export const failStyle = {
    color: "#E74C3C"
}

type ComponentState = {
    robotState: RobotState | null;
}

class TelemetryList extends React.Component<any, ComponentState> {
    constructor(props: any) {
        super(props);
        this.state = { robotState: null }
    }
    async componentDidMount(): Promise<void> {
        let currentState = await invoke<RobotState>('get_robotstate');
        this.setState({robotState: currentState});
        setInterval(async () => {
            currentState = await invoke<RobotState>('get_robotstate');
            if (currentState.commsAlive !== this.state.robotState?.commsAlive) {
                this.setState({robotState: currentState});
            }
        }, 50);
    }
    telemetryBadge(name: string, alive: boolean, {/*type: ErrorExplanation*/}): React.ReactElement {
        let badge;
        if (alive) {
            badge = (
                <span className="badge text-bg-success text-success" style={successStyle}>AA</span>
            )
        } else {
            badge = (
                <span className="badge text-bg-danger text-danger" style={failStyle}
                    /*onMouseEnter={(_) => props.updateExplanation(type)}
                    onMouseLeave={(_) => props.updateExplanation(null)}*/>AA</span>
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
            {this.telemetryBadge("Communications", this.state.robotState?.commsAlive ?? false, ErrorExplanation.Comms)}
            {this.telemetryBadge("Robot Code", this.state.robotState?.codeAlive ?? false, ErrorExplanation.Code)}
            {this.telemetryBadge("Joysticks", this.state.robotState?.joysticksConnected ?? false, ErrorExplanation.Joysticks)}
        </ul>)
    }
}

export default TelemetryList;