import React from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ConsoleMessageType, ConsoleOutput } from "@lib/ipc-new";
import { consoleItemStyle, mainConsoleStyle, windowedConsoleStyle } from "@lib/styles";


type ComponentProps = {
    window: "main" | "console";
    enabled: boolean | null;
}

type ComponentState = {
    messages: string[];
    consoleOutput: ConsoleOutput;
    windowSize: {
        width: number;
        height: number
    } | null
}

class RobotConsole extends React.Component<ComponentProps, ComponentState> {
    private readonly listRef = React.createRef<HTMLDivElement>();
    constructor(props: any) {
        super(props);

        this.listRef = React.createRef();
        this.state = { messages: [], consoleOutput: { messageContent: "", messageType: ConsoleMessageType.NO_OUTPUT, messageName: "NO_OUTPUT", clearConsole: false }, windowSize: null }
    }

    async componentDidMount(): Promise<void> {
        if (this.props.window == "main") {
            await listen<ConsoleOutput>("stdout-message", async (event) => {
                let latestOutput = event.payload;
                let currentMessages = this.state.messages;
                if (latestOutput.clearConsole) currentMessages = [];
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
            await listen<ConsoleOutput>("stdout-message", async (event) => {
                let latestOutput = event.payload;
                let lastOutput = this.state.consoleOutput;
                let currentMessages = this.state.messages;
                if (latestOutput.clearConsole == true) {
                    switch (latestOutput.messageType) {
                        case ConsoleMessageType.COMMS_ERROR: break;
                        case ConsoleMessageType.CODE_ERROR: break;
                        case ConsoleMessageType.JOYSTICK_ERROR: break;
                        case ConsoleMessageType.CLEAR_CONSOLE: {
                            if (lastOutput.messageType == ConsoleMessageType.SIMULATION_MESSAGE) {
                                currentMessages = [];
                            }
                            break;
                        }
                        default: currentMessages = [];
                    }
                }
                if (typeof latestOutput.messageContent === "string" && latestOutput.messageContent !== "") currentMessages.push(latestOutput.messageContent);
                this.setState({ messages: currentMessages, consoleOutput: latestOutput, })
            })
        }
    }

    componentDidUpdate() {
        let node = this.listRef.current;
        if (node) {
            node.scrollIntoView({ behavior: "auto" });
        }
    }

    render() {
        const items = this.state.messages.map((message, index) => {
            return (
                <div style={consoleItemStyle} className="console" key={index}>{message}</div>
            )
        });
        return (
            <InfiniteScroll next={() => { }} hasMore={false} loader={""} dataLength={items.length}
                style={this.props.window == 'main' ? mainConsoleStyle : windowedConsoleStyle(this.state.windowSize)} className="form-control bg-secondary">
                {items}
                <div ref={this.listRef} key={-1}></div>
            </InfiniteScroll>
        )
    }
}

export default RobotConsole;