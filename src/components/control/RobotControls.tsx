import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { register } from '@tauri-apps/plugin-global-shortcut';
import { failStyle, successStyle } from "@lib/styles";

type ComponentProps = {
    enabled: boolean | null;
}

class RobotControls extends React.Component<ComponentProps, any> {
    render() {
        return (
            <div className="btn-group user-select-none" role="group" aria-label="Robot Control Buttons">
                <button id="enableButton" type="button" className={`btn btn-lg btn-secondary ${this.props.enabled ? "active" : ""}`}
                    onClick={(ev) => this.handleClick(ev, true)} style={successStyle}>
                    <b>Enable</b>
                </button>
                <button id="disableButton" type="button" className={`btn btn-lg btn-secondary ${!this.props.enabled ? "active" : ""}`}
                    onClick={(ev) => this.handleClick(ev, false)} style={failStyle}>
                    <b>Disable</b>
                </button>
            </div>
        )
    }
    async handleClick(ev: React.MouseEvent<HTMLButtonElement>, enable: boolean) {
        ev.currentTarget.blur();
        if (enable) {
            await register('Enter', async () => {
                console.log("Robot Disabled");
                await invoke('disable');
            })
            await register('Space', async () => {
                console.log("Robot Emergency Stopped!")
                await invoke('estop');
            })
            await invoke('enable');
        }
        if (!enable) {
            await invoke('disable');
        }
    }
}

export default RobotControls;