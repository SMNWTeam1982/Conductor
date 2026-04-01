import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { register } from '@tauri-apps/plugin-global-shortcut';
import { failStyle, successStyle } from "@lib/styles";
import { DriverStationState } from "@lib/ipc";

type ComponentProps = {
    enabled: boolean | undefined;
    estopped: boolean | undefined;
    driverStationState: DriverStationState | undefined;
}

class RobotControls extends React.Component<ComponentProps, any> {
    render() {
        return (
            <div className="btn-group user-select-none" role="group" aria-label="Robot Control Buttons">
                <button id="enableButton" type="button" className={`btn btn-lg btn-secondary ${this.props.enabled && !this.props.estopped ? "active" : ""}`}
                    onClick={(ev) => this.handleClick(ev, true)} style={successStyle}>
                    <b>Enable</b>
                </button>
                <button id="disableButton" type="button" className={`btn btn-lg btn-secondary ${!this.props.enabled || this.props.estopped ? "active" : ""}`}
                    onClick={(ev) => this.handleClick(ev, false)} style={failStyle}>
                    <b>Disable</b>
                </button>
            </div>
        )
    }
    async handleClick(ev: React.MouseEvent<HTMLButtonElement>, enable: boolean) {
        ev.currentTarget.blur();
        if (this.props.estopped != null && this.props.estopped == false && this.props.driverStationState?.hasComms) {
            if (enable) {
                await register('Enter', async () => {
                    console.log("Robot Disabled");
                    await invoke('set_disabled');
                })
                await register('Space', async () => {
                    console.log("Robot Emergency Stopped!")
                    await invoke('set_estopped');
                })
                await invoke('set_enabled');
            }
            if (!enable) {
                await invoke('set_disabled');
            }
        }
    }
}

export default RobotControls;