import React from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ConsoleMessageType, ConsoleOutput } from "@lib/ipc-new";
import { consoleItemStyle, mainConsoleStyle, windowedConsoleStyle } from "@lib/styles";
import { invoke } from "@tauri-apps/api/core";
import { ActionButton } from "@components/settings/ActionButton";


type ComponentProps = {
    window: "main" | "console";
    enabled: boolean | null;
}

type ComponentState = {
    messages: string[];
    consoleOutput: ConsoleOutput;
    consoleShouldClear: boolean;
    windowSize: {
        width: number;
        height: number
    } | null
}

class RobotConsole extends React.Component<ComponentProps, ComponentState> {
    private readonly listRef = React.createRef<HTMLDivElement>();
    private unlistenConsole?: UnlistenFn;
    constructor(props: any) {
        super(props);

        this.listRef = React.createRef();
        this.state = { messages: [], consoleOutput: { messageContent: "", messageType: ConsoleMessageType.NO_OUTPUT, messageName: "NO_OUTPUT", clearConsole: false }, consoleShouldClear: false, windowSize: null }
    }

    async componentDidMount(): Promise<void> {
        if (this.props.window == "main") {
            await invoke("manage_console", { messageType: ConsoleMessageType.NO_OUTPUT })
            this.unlistenConsole = await listen<ConsoleOutput>("console-message", async (event) => {
                let latestOutput = event.payload;
                let lastOutput = this.state.consoleOutput;
                let currentMessages = this.state.messages;
                switch (lastOutput.messageType) {
                    case ConsoleMessageType.COMMS_ERROR: this.setState({ consoleShouldClear: false }); break;
                    case ConsoleMessageType.CODE_ERROR: this.setState({ consoleShouldClear: false }); break;
                    case ConsoleMessageType.JOYSTICK_ERROR: this.setState({ consoleShouldClear: false }); break;
                    case ConsoleMessageType.CONSOLE_MESSAGE: this.setState( {consoleShouldClear: false}); break;
                    case ConsoleMessageType.SIMULATION_MESSAGE: this.setState({ consoleShouldClear: true }); break;
                    default: this.setState({ consoleShouldClear: true})
                }
                if (lastOutput.messageType == ConsoleMessageType.SIMULATION_MESSAGE && lastOutput.messageType == latestOutput.messageType) currentMessages = []
                if (this.state.consoleShouldClear) currentMessages = [];
                if (typeof latestOutput.messageContent === "string" && latestOutput.messageContent !== "") currentMessages.push(latestOutput.messageContent);
                if (Array.isArray(latestOutput.messageContent)) currentMessages = currentMessages.concat(latestOutput.messageContent);
                this.setState({ messages: currentMessages, consoleOutput: latestOutput })
            })
        }
        if (this.props.window == "console") {
            const appWindow = getCurrentWindow();
            let size = (await appWindow.innerSize()).toLogical(await appWindow.scaleFactor());
            this.setState({ windowSize: { height: size.height, width: size.width } })
            await listen("tauri://resize", async () => {
                let size = (await appWindow.innerSize()).toLogical(await appWindow.scaleFactor());
                this.setState({ windowSize: { height: size.height, width: size.width } })
            })
            await invoke("manage_console", { messageType: ConsoleMessageType.NO_OUTPUT })
            this.unlistenConsole = await listen<ConsoleOutput>("console-message", (event) => {
                let latestOutput = event.payload;
                let lastOutput = this.state.consoleOutput;

                let currentMessages = this.state.messages;
                switch (lastOutput.messageType) {
                    case ConsoleMessageType.COMMS_ERROR: this.setState({ consoleShouldClear: false }); break;
                    case ConsoleMessageType.CODE_ERROR: this.setState({ consoleShouldClear: false }); break;
                    case ConsoleMessageType.JOYSTICK_ERROR: this.setState({ consoleShouldClear: false }); break;
                    case ConsoleMessageType.SIMULATION_MESSAGE: {
                        if (latestOutput.messageType == lastOutput.messageType) this.setState({ consoleShouldClear: true });
                        this.setState({ consoleShouldClear: false})
                        break;
                    }
                    case ConsoleMessageType.CLEAR_CONSOLE: (latestOutput.messageType == lastOutput.messageType) && this.setState({ consoleShouldClear: true }); break;
                    case ConsoleMessageType.RESTART_CODE: this.setState({ consoleShouldClear: false }); break;
                    case ConsoleMessageType.RESTART_ROBOT: this.setState({ consoleShouldClear: false }); break;
                }
                if (latestOutput.clearConsole && (this.state.consoleShouldClear || latestOutput.messageType == ConsoleMessageType.SIMULATION_MESSAGE)) currentMessages = [];

                if (typeof latestOutput.messageContent === "string" && latestOutput.messageContent !== "") currentMessages.push(latestOutput.messageContent);
                this.setState({ messages: currentMessages, consoleOutput: latestOutput })
            })
        }
    }

    componentDidUpdate() {
        let node = this.listRef.current;
        if (node) {
            node.scrollIntoView({ behavior: "auto" });
        }
    }

    componentWillUnmount(): void {
        if (this.unlistenConsole) this.unlistenConsole();
    }

    render() {
        const items = this.state.messages.map((message, index) => {
            return (
                <div style={consoleItemStyle} className={this.props.window == 'main' ? '' : 'ms-2'} key={index}>{message}</div>
            )
        });
        return (
            <div>
                <InfiniteScroll next={() => { }} hasMore={false} loader={""} dataLength={items.length}
                    style={this.props.window == 'main' ? mainConsoleStyle : windowedConsoleStyle(this.state.windowSize)}
                    className={`${this.props.window == 'console' && 'console'} form-control bg-secondary`}>
                    {items}
                    <div ref={this.listRef} key={-1}></div>
                </InfiniteScroll>
                {this.props.window == 'console' && <div className='d-flex justify-content-end'>
                    <div className="col"></div>
                    <div className="col float-end d-flex flex-column align-content-center justify-content-end w-100" style={{ "marginLeft": "25%" }}>
                        <ActionButton actionCallback={() => invoke('manage_console', { messageType: ConsoleMessageType.CLEAR_CONSOLE })} title='Clear Console' icon="bi-trash" />
                    </div>
                </div>}
            </div>
        )
    }
}

export default RobotConsole;