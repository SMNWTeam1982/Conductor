import React, { FormEvent, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ConsoleMessageType } from "@lib/ipc-new";
import { ActionButton } from "@components/settings/ActionButton";

type PageState = {
    teamNumber: number | null;
    gsm: string | null;
    useUSB: boolean | null;
}

class SettingsPage extends React.Component<any, PageState> {
    constructor(props: any) {
        super(props);
        this.state = { teamNumber: null, gsm: null, useUSB: null }
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
                            onKeyDown={(e) => this.teamNumberChangeHandler(e)} />
                    </div>
                    <label htmlFor="gameDataInput">Game Data</label>
                    <div className="input-group mb-3">
                        <input type="text" className="form-control disabled" id="gameDataInput" value={this.state.gsm ?? ""}
                            onInput={(e) => this.gsmChangeHandler(e)}
                            onKeyDown={(e) => this.gsmChangeHandler(e)} />
                    </div>
                    <div className="form-check mb-3">
                        <label htmlFor="useUSBCheckbox">Connect via USB</label>
                        <input type="checkbox" className="form-check-input" id="useUSBCheckbox" checked={this.state.useUSB ?? false}
                            onChange={() => this.usbStateChangeHandler()} />
                    </div>
                </div>

                <div className="col" />
                <div className="col float-end">
                    <div className="flex-column d-flex mt-2">
                        <ActionButton action={ConsoleMessageType.RESTART_CODE} actionCallback={() => this.restartButtonHandler(ConsoleMessageType.RESTART_CODE)} />
                        <ActionButton action={ConsoleMessageType.RESTART_ROBOT} actionCallback={() => this.restartButtonHandler(ConsoleMessageType.RESTART_ROBOT)} />
                        <ActionButton actionCallback={async () => await invoke("create_console_window")} title="Open Console" icon="bi-terminal" />
                    </div>
                </div>
            </div>
        </div>)
    }

    teamNumberChangeHandler(inputEvent?: FormEvent<HTMLInputElement>) {
        if (inputEvent) {
            let team = inputEvent.currentTarget.value;
            if (team.length <= 4) this.setState({ teamNumber: parseInt(team) })
        }
        if (this.state.teamNumber) {
            setTimeout(async () => await invoke('update_team_number', { teamNumber: this.state.teamNumber }), 500)
        }
    }
    gsmChangeHandler(inputEvent?: FormEvent<HTMLInputElement>) {
        if (inputEvent) {
            let data = inputEvent.currentTarget.value;
            if (data.length <= 3) this.setState({ gsm: data })
        }
        if (this.state.gsm && this.state.gsm.length == 3) {
            setTimeout(async () => await invoke('update_game_data', { gsm: this.state.gsm }), 500)
        }
    }

    async usbStateChangeHandler() {
        this.setState({ useUSB: !this.state.useUSB })
        await invoke("use_usb", { value: !this.state.useUSB });
        // setTimeout(async () => {
        //     let currentState = await invoke<DriverStationState>("get_robotstate");
        //     console.log(currentState)
        //     if (!currentState.hasComms && this.state.useUSB == true) {
        //         await invoke("use_usb", { value: false })
        //         await invoke("update_team_number", { teamNumber: this.state.teamNumber })
        //         this.setState( { useUSB: false })
        //     }
        // }, 500)
    }

    async restartButtonHandler(action: ConsoleMessageType) {
        switch (action) {
            case ConsoleMessageType.RESTART_CODE:
                await invoke("restart_code");
                break;
            case ConsoleMessageType.RESTART_ROBOT:
                await invoke("restart_roborio");
                break;
        }
        // await invoke("manage_console", { messageType: ConsoleMessageType.NO_OUTPUT });
        await invoke("manage_console", { messageType: action });
    }
}

export default SettingsPage;