import { REQUEST, RequestType, UPDATE_GSM, UPDATE_USB_STATUS } from "@lib/ipc";
import { GSM_CHANGE, type DriverStationState } from "@lib/store";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import React from "react";
import { connect, type ConnectedProps } from "react-redux";

const mapState = (state: DriverStationState) => ({
    useUSB: state.connectUSB,
    gsm: state.gsm
});

const mapDispatch = {
    updateUSB: (useUSB: boolean) => ({ type: UPDATE_USB_STATUS, use_usb: useUSB }),
    updateGSM: (gsm: string) => ({ type: UPDATE_GSM, gsm: gsm }),
    changeGSM: (gsm: string) => ({ type: GSM_CHANGE, gsm: gsm }),
    dispatchRequest: (req: RequestType) => ({ type: REQUEST, req: req }),
}

const connectSettingsState = connect(mapState, mapDispatch);

type Props = ConnectedProps<typeof connectSettingsState>;

type PageState = {
    teamNumber: number;
    estopped: boolean;
}

class SettingsPage extends React.Component<Props, PageState> {
    constructor(props: Props) {
        super(props);
        this.state = { teamNumber: 1982, estopped: false }
    }

    async componentDidMount(): Promise<void> {
        listen<boolean>('is-estopped', (event) => {
            this.setState({ estopped: event.payload })
        })
        const teamNumber = await invoke<number>('get_team_number')
        this.setState({ teamNumber })
    }

    render(): ReactNode {
        return (<div className="container text-light">
            <div className="row align-items-center">
                <div className="col py-2">
                    <label htmlFor="teamNumberInput">Team Number</label>
                    <div className="input-group mb-3">
                        <input type="number" className="form-control" id="teamNumberInput" value={this.state.teamNumber}
                            onChange={(e) => this.teamNumberChangeHandler(e.target.value)} />
                    </div>
                    <label htmlFor="useUSBCheckbox">Connect via USB?</label>
                    <div className="form-check mb-3">
                        <input type="checkbox" className="form-check-input" id="useUSBCheckbox" checked={this.props.useUSB}
                            onChange={(change: ChangeEvent<HTMLInputElement>) => this.props.updateUSB(change.currentTarget.checked)} />
                    </div>
                    <label htmlFor="gameDataInput">Game Data</label>
                    <div className="input-group mb-3">
                        <input type="text" className="form-control disabled" id="gameDataInput" value={this.props.gsm}
                            onInput={this.gsmChangeHandler()}
                            onKeyDown={this.keyPressHandler()} />
                    </div>
                </div>

                <div className="col" />
                <div className="col pull-right">
                    <div className="btn-group-vertical">
                        <button type="button" className="btn btn-secondary"
                            onClick={(_) => this.props.dispatchRequest(RequestType.RestartRoborio)}>Restart roboRIO
                        </button>
                        <button type="button" className="btn btn-secondary"
                            onClick={(_) => this.props.dispatchRequest(RequestType.RestartCode)}>Restart Robot Code
                        </button>
                    </div>
                </div>
            </div>
        </div>)
    }
    async teamNumberChangeHandler(team: string) {
        if (team.length <= 4) {
            let teamNumber = parseInt(team)
            this.setState({ teamNumber })
            invoke('update_team_number', { teamNumber })
        }
    }
    gsmChangeHandler() {
        return (ev: FormEvent<HTMLInputElement>) => {
            let gsm = ev.currentTarget.value;
            if (gsm.length <= 3) {
                this.props.changeGSM(gsm);
            }
        }
    }

    keyPressHandler() {
        return (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key == "Enter") {
                this.props.updateGSM(this.props.gsm);
            }
        }

    }
}

export default connectSettingsState(SettingsPage);