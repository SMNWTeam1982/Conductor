import React, { FormEvent, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ConsoleMessageType } from "@lib/ipc-new";

type PageState = {
    teamNumber: number | null;
    gsm: string | null;
    useUSB: boolean | null;
}

class SettingsPage extends React.Component<any, PageState> {
    constructor(props: any) {
        super(props);
        this.state = { teamNumber: null, gsm: null, useUSB: null}
    }

    async componentDidMount(): Promise<void> {
        const teamNumber = await invoke<number>('get_team_number');
        const useUSB = await invoke<boolean>('get_usb');
        const gsm = await invoke<string>('get_game_data');
        this.setState({ teamNumber, useUSB, gsm })
    }

    render(): ReactNode {
        return (<div className="container text-light">
            <div className="row align-items-center">
                <div className="col py-2">
                    <label htmlFor="teamNumberInput">Team Number</label>
                    <div className="input-group mb-3">
                        <input type="number" className="form-control" id="teamNumberInput" value={this.state.teamNumber ?? 0}
                            onInput={(e) => this.teamNumberChangeHandler(e)} 
                            onKeyDown={(e) => this.teamNumberChangeHandler(e)}/>
                    </div>
                    <label htmlFor="useUSBCheckbox">Connect via USB?</label>
                    <div className="form-check mb-3">
                        <input type="checkbox" className="form-check-input" id="useUSBCheckbox" checked={this.state.useUSB ?? false}
                            onChange={() => this.usbStateChangeHandler()} />
                    </div>
                    <label htmlFor="gameDataInput">Game Data</label>
                    <div className="input-group mb-3">
                        <input type="text" className="form-control disabled" id="gameDataInput" value={this.state.gsm ?? ""}
                            onInput={(e) => this.gsmChangeHandler(e)} 
                            onKeyDown={(e) => this.gsmChangeHandler(e)}/>
                    </div>
                </div>

                <div className="col" />
                <div className="col pull-right">
                    <div className="btn-group-vertical">
                        <button type="button" className="btn btn-secondary"
                            onClick={async (_) => {
                                await invoke("restart_code")
                                await invoke("manage_console", { messageType: ConsoleMessageType.RESTART_CODE })
                            }}>Restart Robot Code
                        </button>
                        <button type="button" className="btn btn-secondary"
                            onClick={async (_) => {
                                await invoke("restart_controller")
                                await invoke("manage_console", { messageType: ConsoleMessageType.RESTART_ROBOT })
                            }}>Restart roboRIO
                        </button>
                    </div>
                </div>
            </div>
        </div>)
    }

    async usbStateChangeHandler() {
        this.setState({ useUSB: !this.state.useUSB })
        await invoke("use_usb", { value: !this.state.useUSB });
    }

    teamNumberChangeHandler(inputEvent?: FormEvent<HTMLInputElement>) {
        if (inputEvent) {
            let team = inputEvent.currentTarget.value;
            if (team.length <= 4) this.setState({ teamNumber: parseInt(team) })
        }
        if (this.state.teamNumber) {
            setTimeout(() => invoke('update_team_number', { teamNumber: this.state.teamNumber }), 500)
        }
    }
    gsmChangeHandler(inputEvent?: FormEvent<HTMLInputElement>) {
        if (inputEvent) {
            let data = inputEvent.currentTarget.value;
            if (data.length <= 3) this.setState({ gsm: data })
        }
        if (this.state.gsm && this.state.gsm.length == 3) {
            setTimeout(() => invoke('update_game_data', { gsm: this.state.gsm }), 500)
        }
    }
}

export default SettingsPage;