import React, { type ReactElement } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { DriverStationState, ControlMode, ConsoleMessageType, ConsoleOutput } from "@lib/ipc-new";
import { successStyle, failStyle } from "@lib/styles";
import RobotTelemetry from "@components/overview/RobotTelemetry";
import ModeList from "@components/overview/RobotModes";
import RobotConsole from "@components/overview/RobotConsole";
import RobotControls from "@components/overview/RobotControls";
import AllianceSelector from "@components/overview/AllianceSelector";



type PageState = {
    enabled: boolean | null;
    estopped: boolean | null;
    mode: ControlMode | null;
    driverStationState: DriverStationState | null;
    teamNumber: number | null;
}

class OverviewPage extends React.Component<any, PageState> {
    constructor(props: any) {
        super(props);
        this.state = { enabled: null, estopped: null, mode: null, driverStationState: null, teamNumber: null }
    }
    async componentDidMount(): Promise<void> {
        let currentState = await invoke<DriverStationState>('get_ds_state');
        let currentMode = await invoke<ControlMode>('get_mode');
        let teamNumber = await invoke<number>('get_team_number');
        let enabled = await invoke<boolean>('get_enabled');
        await invoke("manage_console", { messageType: ConsoleMessageType.NO_OUTPUT })

        setInterval(async () => {
            const prevState = this.state.driverStationState
            const newState = await invoke<DriverStationState>('get_robotstate');
            const lastOutput = await invoke<ConsoleOutput>('get_last_console_output')
            const estopped = await invoke<boolean>('get_estopped');

            if (newState.isSimulator && lastOutput.messageType != ConsoleMessageType.SIMULATION_MESSAGE && (lastOutput.messageType == ConsoleMessageType.CLEAR_CONSOLE || (!lastOutput.messageName.includes("ERROR") && lastOutput.messageContent == ""))) {
                await invoke("manage_console", { messageType: ConsoleMessageType.SIMULATION_MESSAGE })
            }
            if (!newState.isSimulator && (lastOutput.messageType == ConsoleMessageType.SIMULATION_MESSAGE)) {
                await invoke("manage_console", { messageType: ConsoleMessageType.CLEAR_CONSOLE })
            }
            if (prevState && !prevState.hasComms && newState.hasComms) {
                await invoke("manage_console", { messageType: ConsoleMessageType.NO_OUTPUT })
            }
            if (prevState && (newState.hasComms != prevState.hasComms || newState.hasCode != prevState.hasCode)) this.setState({ driverStationState: newState });
            if (this.state.estopped !== estopped) this.setState({ estopped })
        }, 50)
        listen<number>('mode', (event) => {
            this.setState({ mode: event.payload })
        })
        listen<boolean>('is-enabled', async (event) => {
            if (event.payload === false) await unregisterAll();
            this.setState({ enabled: event.payload })
        })
        listen<boolean>('is-estopped', (event) => {
            this.setState({ estopped: event.payload })
        })
        this.setState({ mode: currentMode, driverStationState: currentState, teamNumber, enabled })
    }
    componentWillUnmount(): void {
    }

    render(): React.ReactNode {
        return (
            <div className="container-fluid text-light">
                <div className="row">
                    <div className="col-3 mt-4 d-flex flex-column user-select-none">
                        <ModeList />
                    </div>

                    <div className="col-3 user-select-none">
                        <RobotTelemetry driverStationState={this.state.driverStationState} />
                    </div>

                    <div className="col-2 user-select-none">
                        <p className="lead mt-3 fw-medium text-center">
                            Team # {this.state.teamNumber}
                        </p>
                        <div className="container">
                            <div className="row text-center">
                                <p><b>Battery</b></p>
                                <p className={`col-1 ${this.getVoltageClass()} w-50`}>
                                    <b>
                                        {this.state.driverStationState?.batteryVoltage
                                            ? this.state.driverStationState.batteryVoltage.toFixed(2) + "V"
                                            : "N/A"}
                                    </b>
                                </p>
                                <p className={`col-4 ${this.getVoltageClass()} w-50`}>
                                    <b>
                                        {this.state.driverStationState?.batteryVoltage ?
                                            ((this.state.driverStationState.batteryVoltage / 12) * 100).toFixed(1) + "%" : ''}
                                    </b>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col">
                        <RobotConsole window="main" enabled={this.state.enabled} />
                    </div>
                </div>
                <div className="row user-select-none" style={{ marginTop: "-50px" }}>
                    <div className="col-3 text-center mt-4">
                        <RobotControls enabled={this.state.enabled} estopped={this.state.estopped} />
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
                    {/* <div className="col" /> */}
                    <div className="col" style={{ marginTop: "-15px" }}>
                        <div className="row row-cols-2">
                            {this.getSimulatorState()}
                            <button className="btn btn-secondary text-light w-auto ms-0 my-2"
                            style={{ marginRight: "2.5rem" }}
                            onClick={async () => await invoke("create_console_window")}>                            
                                <i className="bi bi-box-arrow-down-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    getVoltageClass(): string {
        const voltage = this.state.driverStationState?.batteryVoltage;
        if (voltage === undefined || voltage == 0) {
            return "text-secondary w-100";
        }
        if (voltage >= 8.5 && voltage <= 11.5) { return "text-warning" } else
            if (voltage < 8.5) { return "text-danger" } else
                return "text-success"
    }

    getRobotStatus(): string {
        if (this.state.estopped === true) { return "Emergency Stopped" } else
            if (this.state.driverStationState?.hasCode === true) {
                if (this.state.enabled === true) {
                    return this.state.mode !== null && this.state.mode !== undefined
                        ? ControlMode[this.state.mode] + "\nEnabled"
                        : "Unknown Mode\nEnabled";
                } else
                    return this.state.mode !== null && this.state.mode !== undefined
                        ? ControlMode[this.state.mode] + "\nDisabled"
                        : "Unknown Mode\nDisabled";
            } else if (!this.state.driverStationState?.hasCode && this.state.driverStationState?.hasComms) { return "No Robot Code" } else
                return "No Robot Communication"
    }

    getSimulatorState(): ReactElement {
        let badge;

        if (this.state.driverStationState?.isSimulator) {
            badge = (<span className="badge rounded-pill text-bg-success text-success" style={successStyle}>*</span>)
        } else {
            badge = (<span className="badge rounded-pill text-bg-danger text-danger" style={failStyle}>*</span>)
        }
        return (
            <p className="text-sm-left w-auto m-auto ms-0">Simulator Connection {badge}</p>
        )
    }
}

export default OverviewPage;