import { ConsoleMessageType } from "@lib/ipc-new";
import React from "react";

type ComponentProps = {
    action?: ConsoleMessageType;
    title?: string;
    icon?: string;
    actionCallback: Function;
}

type ComponentState = {
    isSelected: boolean;
    isClicked: boolean;
}

export class ActionButton extends React.Component<ComponentProps, ComponentState> {
    private title: string;
    private icon: string;
    private unselectedStyle: string;
    private selectedStyle: string;
    private selectionDuration: number;
    constructor(props: ComponentProps) {
        super(props)
        switch (this.props.action) {
            case ConsoleMessageType.RESTART_CODE:
                this.title = 'Restart Robot Code';
                this.icon = 'bi-arrow-clockwise'
                this.unselectedStyle = 'btn-outline-warning';
                this.selectedStyle = 'btn-warning';
                this.selectionDuration = 1500;
                break;
            case ConsoleMessageType.RESTART_ROBOT:
                this.title = 'Restart roboRIO';
                this.icon = 'bi-arrow-repeat';
                this.unselectedStyle = 'btn-outline-danger';
                this.selectedStyle = 'btn-danger';
                this.selectionDuration = 2500;
                break;
            default:
                this.title = this.props.title ?? "Untitled Button"
                this.icon = this.props.icon ?? 'exclamation-lg';
                this.unselectedStyle = 'btn-outline-secondary'
                this.selectedStyle = 'btn-secondary'
                this.selectionDuration = 500;
        }
        this.state = { isSelected: false, isClicked: false }
    }
    render(): React.ReactNode {
        return (<button type="button" className={`btn m-2 ${(this.state.isSelected || this.state.isClicked) ? this.selectedStyle : this.unselectedStyle}`}
            onClick={() => this.handleClick()}
            onMouseOver={() => this.setState({ isSelected: true })}
            onMouseOut={() => this.setState({ isSelected: false })}>
            <div className="row row-cols-2">
                <i className={`bi ${this.icon} w-auto ms-4 m-auto`} />
                <p className="w-75 text-start m-auto">{this.title}</p>
            </div>
        </button>)
    }

    handleClick() {
        this.props.actionCallback();
        this.setState({ isClicked: true })
        setTimeout(() => { this.setState({ isSelected: false, isClicked: false }) }, this.selectionDuration)
    }

}