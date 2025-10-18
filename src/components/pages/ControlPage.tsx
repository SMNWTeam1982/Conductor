import { RobotState, Mode } from "@lib/store";
import React, { type ReactElement } from "react";
import TelemetryList, { failStyle, successStyle } from "@components/control/RobotTelemetry";
import ModeList from "@components/control/RobotModes";
import RobotConsole from "@components/control/RobotConsole";
import StateControls from "@components/control/RobotControls";
import AllianceSelector from "@components/control/AllianceSelector";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";



type PageState = {
    enabled: boolean | null;
    estopped: boolean | null;
    mode: Mode | null;
    robotState: RobotState | null;
    teamNumber: number;
}

class ControlPage extends React.Component<any, PageState> {
    constructor(props: any) {
        super(props);
        this.state = { enabled: null, estopped: null, mode: null, robotState: null, teamNumber: 1982 }
    }
    async componentDidMount(): Promise<void> {
        let currentState = await invoke<RobotState>('get_robotstate');
        let currentMode = await invoke<Mode>('get_mode');
        let teamNumber = await invoke<number>('get_team_number');

        setInterval(async () => {
            const newState = await invoke<RobotState>('get_robotstate');
            if (newState.commsAlive) {
                this.setState({ robotState: newState })
            }
        }, 50)
        listen<number>('mode', (event) => {
            this.setState({ mode: event.payload })
        })
        listen<boolean>('is-enabled', (event) => {
            this.setState({ enabled: event.payload })
        })
        listen<boolean>('is-estopped', (event) => {
            this.setState({ estopped: event.payload })
        })
        this.setState({ mode: currentMode, robotState: currentState, teamNumber })
    }

    render(): React.ReactNode {
        return (
            <div className="container-fluid text-light">
                <div className="row">
                    <div className="col-3 mt-4 d-flex flex-column user-select-none">
                        <ModeList />
                    </div>

                    <div className="col-3 user-select-none">
                        <TelemetryList />
                    </div>

                    <div className="col-2 user-select-none">
                        <p className="lead mt-3 fw-medium">
                            Team # {this.state.teamNumber}
                        </p>
                        <p className={`text-center mt-4 ${this.getVoltageClass()}`}>
                            <b>
                                {this.state.robotState?.voltage
                                    ? this.state.robotState.voltage.toFixed(2) + "V"
                                    : "N/A"}
                            </b>
                        </p>
                    </div>
                    <div className="col">
                        <RobotConsole />
                    </div>
                </div>
                <div className="row user-select-none" style={{ marginTop: "-50px" }}>
                    <div className="col-3 text-center mt-4">
                        <StateControls />
                    </div>
                    <div className="col-3 mt-4 user-select-none">
                        <AllianceSelector />
                    </div>
                    <div className="col-2 align-items-center user-select-none">
                        <p className="text-center lead">{this.getRobotStatus()}</p>
                    </div>
                    <div className="col" />
                </div>
                <div className="row user-select-none">
                    <div className="col" />
                    <div className="col" />
                    <div className="col" />
                    <div className="col" style={{ marginTop: "-15px" }}>
                        {this.getSimulatorState()}
                    </div>
                </div>
            </div>
        )
    }
    getVoltageClass(): string {
        const voltage = this.state.robotState?.voltage;
        if (voltage === undefined) {
            return "text-secondary";
        }
        if (voltage >= 8.5 && voltage <= 11.5) { return "text-warning" } else
            if (voltage < 8.5) { return "text-danger" } else
                return "text-success"
    }

    getRobotStatus(): string {
        if (this.state.estopped === true) { return "Emergency Stopped" } else
            if (this.state.robotState?.codeAlive === true) {
                if (this.state.enabled === true) {
                    return this.state.mode !== null && this.state.mode !== undefined
                        ? Mode[this.state.mode] + "\nEnabled"
                        : "Unknown Mode\nEnabled";
                } else
                    return this.state.mode !== null && this.state.mode !== undefined
                        ? Mode[this.state.mode] + "\nDisabled"
                        : "Unknown Mode\nDisabled";
            } else if (!this.state.robotState?.codeAlive && this.state.robotState?.commsAlive) { return "No Robot Code" } else
                return "No Robot Communication"
    }

    getSimulatorState(): ReactElement {
        let badge;

        if (this.state.robotState?.simulatorConnected) {
            badge = (<span className="badge rounded-pill text-bg-success text-success" style={successStyle}>*</span>)
        } else {
            badge = (<span className="badge rounded-pill text-bg-danger text-danger" style={failStyle}>*</span>)
        }
        return (
            <p className="text-sm-right">Simulator Connection {badge}</p>
        )
    }
}

export default ControlPage;