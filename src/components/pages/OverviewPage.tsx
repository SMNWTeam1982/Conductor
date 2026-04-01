import React, { type ReactElement } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { DriverStationState, DriveMode } from "@lib/ipc";
import { successStyle, failStyle } from "@lib/styles";
import StatusBadges from "@components/overview/StatusBadges";
import ModeList from "@components/overview/ModeList";
import ProgramConsole from "@components/overview/ProgramConsole";
import RobotControls from "@components/overview/RobotControls";
import AllianceSelector from "@components/overview/AllianceSelector";



type PageState = {
    enabled: boolean | undefined;
    estopped: boolean | undefined;
    driveMode: DriveMode | undefined;
    driverStationState: DriverStationState | undefined;
    batteryVoltage: number | null;
    teamNumber: number | null;
}

class OverviewPage extends React.Component<any, PageState> {
    private intervalId?: number;
    private unlisteners: UnlistenFn[] = [];
    private unmounted = false;
    private polling = false;

    constructor(props: any) {
        super(props);
        this.state = { enabled: undefined, estopped: undefined, driveMode: undefined, driverStationState: undefined, batteryVoltage: null, teamNumber: null }
    }
    async componentDidMount(): Promise<void> {
        this.unmounted = false;

        try {
            const [driveMode, teamNumber] = await Promise.all([
                invoke<DriveMode>('get_drive_mode'),
                invoke<number>('get_team_number'),
            ]);
            if (!this.unmounted) this.setState({ driveMode, teamNumber })
        } catch { }

        this.intervalId = window.setInterval(async () => {
            if (this.unmounted || this.polling) return;
            this.polling = true;
            try {
                const [driverStationState, estopped, enabled, batteryVoltage] = await Promise.all([
                    invoke<DriverStationState>('get_ds_state'),
                    invoke<boolean>('get_estopped'),
                    invoke<boolean>('get_enable_status'),
                    invoke<number>('get_battery_voltage'),
                ]);
                if (!this.unmounted) this.setState({ driverStationState, estopped, enabled, batteryVoltage })
            } catch { }
            finally {
                this.polling = false;
            }
        }, 100);

        this.unlisteners.push(
            await listen<number>('drive-mode', (event) => {
                if (this.unmounted) return;
                this.setState({ driveMode: event.payload })
            }),
            await listen<boolean>('enabled-state', async (event) => {
                if (this.unmounted) return;
                if (event.payload === false) await unregisterAll();
                this.setState({ enabled: event.payload });
            }),
            await listen<boolean>('estopped-state', (event) => {
                if (this.unmounted) return;
                this.setState({ estopped: event.payload })
            })
        );
    }
    componentWillUnmount(): void {
        this.unmounted = true;
        if (this.intervalId !== undefined) window.clearInterval(this.intervalId);
        this.intervalId = undefined;
        this.unlisteners.forEach((fn) => fn());
        this.unlisteners = [];
    }

    render(): React.ReactNode {
        return (
            <div className="container-fluid text-light">
                <div className="row">
                    <div className="col-3 mt-4 d-flex flex-column user-select-none">
                        <ModeList />
                    </div>

                    <div className="col-3 user-select-none">
                        <StatusBadges driverStationState={this.state.driverStationState} />
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
                                        {this.state?.batteryVoltage
                                            ? this.state.batteryVoltage.toFixed(2) + "V"
                                            : "N/A"}
                                    </b>
                                </p>
                                <p className={`col-4 ${this.getVoltageClass()} w-50`}>
                                    <b>
                                        {this.state?.batteryVoltage ?
                                            ((this.state.batteryVoltage / 12) * 100).toFixed(1) + "%" : ''}
                                    </b>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col">
                        <ProgramConsole window="main" />
                    </div>
                </div>
                <div className="row user-select-none" style={{ marginTop: "-50px" }}>
                    <div className="col-3 text-center mt-4">
                        <RobotControls driverStationState={this.state.driverStationState} enabled={this.state.enabled} estopped={this.state.estopped} />
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
        const voltage = this.state?.batteryVoltage || 0;
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
                    return this.state.driveMode !== null && this.state.driveMode !== undefined
                        ? DriveMode[this.state.driveMode] + "\nEnabled"
                        : "Unknown Mode\nEnabled";
                } else
                    return this.state.driveMode !== null && this.state.driveMode !== undefined
                        ? DriveMode[this.state.driveMode] + "\nDisabled"
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