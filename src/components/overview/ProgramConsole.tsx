import React from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ConsoleEvent } from "@lib/ipc";
import { consoleItemStyle, mainConsoleStyle, windowedConsoleStyle } from "@lib/styles";
import { invoke } from "@tauri-apps/api/core";
import { ActionButton } from "@components/settings/ActionButton";


type ComponentProps = {
    window: "main" | "console";
}

type ComponentState = {
    messages: string[];
    windowSize: {
        width: number;
        height: number
    } | null
}

class ProgramConsole extends React.Component<ComponentProps, ComponentState> {
    private readonly listRef = React.createRef<HTMLDivElement>();
    private unlistenConsole?: UnlistenFn;
    private unlistenResize?: UnlistenFn;

    private unmounted = false;
    private consoleToken = 0;

    constructor(props: any) {
        super(props);

        this.listRef = React.createRef();
        this.state = { messages: [], windowSize: null }
    }

    async componentDidMount(): Promise<void> {
        this.unmounted = false;
        const token = ++this.consoleToken;

        const unlistenConsole = await listen<ConsoleEvent>("consoleEvent", async (event) => {
            if (this.unmounted) return;

            if (this.props.window === "console" && event.payload.frontend_action) return;

            this.setState((lastState) => {
                if (event.payload.type === "cleared") {
                    return { ...lastState, messages: [] };
                }
                return { ...lastState, messages: [...lastState.messages, ...event.payload.lines] };
            })
        })

        if (this.unmounted || token !== this.consoleToken) {
            unlistenConsole();
            return;
        }
        this.unlistenConsole = unlistenConsole;

        if (this.props.window == "console") {
            const appWindow = getCurrentWindow();
            let size = (await appWindow.innerSize()).toLogical(await appWindow.scaleFactor());
            if (!this.unmounted) {
                this.setState({ windowSize: { height: size.height, width: size.width } })
            }

            const unlistenResize = await listen("tauri://resize", async () => {
                let newSize = (await appWindow.innerSize()).toLogical(await appWindow.scaleFactor());
                if (!this.unmounted) {
                    this.setState({ windowSize: { height: newSize.height, width: newSize.width } })
                }
            });

            if (this.unmounted || token !== this.consoleToken) {
                unlistenResize();
                return;
            }
            this.unlistenResize = unlistenResize;
        }
    }

    componentDidUpdate() {
        let node = this.listRef.current;
        if (node) {
            node.scrollIntoView({ behavior: "auto" });
        }
    }

    componentWillUnmount(): void {
        this.unmounted = true;
        this.consoleToken++;

        this.unlistenConsole?.();
        this.unlistenConsole = undefined;

        this.unlistenResize?.();
        this.unlistenResize = undefined;
    }

    render() {
        const items = this.state.messages.map((message, index) => (
                <div style={consoleItemStyle} className={this.props.window == 'main' ? '' : 'ms-2'} key={index}>{message}</div>
            ));
        return (
            <div>
                <InfiniteScroll next={() => { }} hasMore={false} loader={""} dataLength={items.length}
                    style={this.props.window == 'main' ? mainConsoleStyle : windowedConsoleStyle(this.state.windowSize)}
                    className={`${this.props.window == 'console' && 'console'} form-control bg-secondary`}>
                    {items}
                    <div ref={this.listRef} key={-1}></div>
                </InfiniteScroll>
                {this.props.window == 'console' && (<div className='d-flex justify-content-end'>
                    <div className="col"></div>
                    <div className="col float-end d-flex flex-column align-content-center justify-content-end w-100" style={{ "marginLeft": "25%" }}>
                        <ActionButton actionCallback={ async () => {
                            await invoke("console_action", { action: { type: "clear" } });
                        }} title='Clear Console' icon="bi-trash" />
                    </div>
                </div>)}
            </div>
        )
    }
}

export default ProgramConsole;