import { Mode } from "@lib/store";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import React from "react";

type ComponentState = {
    mode: Mode | null;
}

class ModeList extends React.Component<any, ComponentState> {
    constructor(props: any) {
        super(props);
        this.state = { mode: null };
    }
    async componentDidMount(): Promise<void> {
        this.setState({ mode: await invoke('get_mode') })
        listen<number>('mode', (event) => {
            this.setState({ mode: event.payload });
        })
    }

    async handleClick(event: React.MouseEvent<HTMLButtonElement>, mode: Mode) {
        invoke('set_mode', { mode: mode });
        event.currentTarget.blur();
    }

    modeItem(mode: Mode): React.ReactElement {
        return (
            <button type="button" className={`btn btn-secondary btn-block border border-dark text-start ${this.state.mode == mode ? "active" : ""}`}
                onClick={(event) => this.handleClick(event, mode)}>
                {Mode[mode].toString()}
            </button>
        )
    }

    render() {
        return (<div className="btn-group-vertical">
            {this.modeItem(Mode.Autonomous)}
            {this.modeItem(Mode.Teleoperated)}
            {this.modeItem(Mode.Test)}
        </div>)
    }
}

export default ModeList;