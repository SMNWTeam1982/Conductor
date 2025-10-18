import { Alliance, AllianceStation } from "@lib/store";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import React, { createElement, type ReactElement } from "react";

type ComponentState = {
    alliance: Alliance;
}

class AllianceSelector extends React.Component<any, ComponentState> {
    constructor(props: any) {
        super(props);

        this.state = { alliance: { station: 0, name: "Red", position: 1 } }
    }

    async componentDidMount(): Promise<void> {
        const station = await invoke<number>('get_alliance');
        const { name, position } = this.parseAllianceStation(station)
        listen<number>('alliance', (event) => {
            const { name, position } = this.parseAllianceStation(event.payload);
            this.setState({ alliance: { station: event.payload, name, position } });
        })
        this.setState({ alliance: { station, name, position } });
    }

    render(): React.ReactNode {
        return (<div className="input-group justify-content-center user-select-none">
            <div className="input-group-prepend">
                <label htmlFor="teamSelectorDropdown" className="dropdown-label lead font-weight-normal">Team Station </label>
            </div>
            <div className="dropup" id="teamSelectorDropdown">
                <button className="btn btn-secondary dropdown-toggle"
                    type="button" id="dropdownMenuButton"
                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    {this.formatAlliance(this.state.alliance)}
                </button>
                <div className="dropdown-menu py-1" aria-labelledby="dropdownMenuButton">
                    {this.getAllianceList()}
                </div>
            </div>
        </div>)
    }

    formatAlliance(alliance: Alliance): string {
        return alliance.name + " " + alliance.position.toString();
    }

    parseAllianceStation(station: number): { name: string, position: number } {
        const positionMap: { [key: string]: number } = { One: 1, Two: 2, Three: 3 };
        const match = AllianceStation[station].match(/^(Red|Blue)(One|Two|Three)$/);
        if (!match) return { name: "", position: 0 }
        const name = match[1];
        const position = positionMap[match[2]];
        return { name, position }
    }

    getAllianceList(): ReactElement {
        let stations: ReactElement[] = [];
        for (let i = 0; i < 6; i++) {
            const alliance: Alliance = (i < 3) ? { station: i + 1, name: "Red", position: i + 1 } : { station: i + 1, name: "Blue", position: (i - 2) };
            const handleClick = async () => await invoke('set_alliance', { alliance: i })
            stations.push(createElement('a', { className: 'dropdown-item py-1 dropdown-bg-primary', href: '#', key: i, onClick: handleClick }, this.formatAlliance(alliance)));
        }
        return (<>
            {stations}
        </>)
    }
}

export default AllianceSelector;