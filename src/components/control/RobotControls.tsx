import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';


type ComponentState = {
    enabled: boolean | null;
}

class StateControls extends React.Component<any, ComponentState> {
    constructor(props: any) {
        super(props);
        this.state = { enabled: null };
    }
    async componentDidMount(): Promise<void> {
        listen<boolean>('is-enabled', (event) => {
            this.setState({ enabled: event.payload }, async () => {
                if (event.payload === false) await unregisterAll();
            })
        })
    }
    render() {
        return (
            <div className="btn-group user-select-none" role="group" aria-label="State Control Buttons">
                <button id="enableButton" type="button" className={`btn btn-lg btn-secondary ${this.state.enabled ? "active" : ""}`}
                    onClick={(ev) => this.handleClick(ev, true)} style={{ color: "#11CD9D" }}>
                    <b>Enable</b>
                </button>
                <button id="disableButton" type="button" className={`btn btn-lg btn-secondary ${!this.state.enabled ? "active" : ""}`}
                    onClick={(ev) => this.handleClick(ev, false)} style={{ color: "#F85D4D" }}>
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
        this.setState({ enabled: enable })
    }
}

export default StateControls;