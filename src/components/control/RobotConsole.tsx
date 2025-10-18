import { type DriverStationState, ErrorExplanation } from "@lib/store";
import { connect, type ConnectedProps } from "react-redux";
import React from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

const mapState = (state: DriverStationState) => ({
    messages: state.stdout,
    enabled: state.enabled,
    explanation: state.explanation
});

const mapDispatch = ({});

const connector = connect(mapState, mapDispatch);

type Props = ConnectedProps<typeof connector>;

const COMMS_ERROR = ["The robot controller and driver station are not able to communicate."];

const CODE_ERROR =
    ["There is no user code running on the robot.",
        "1. Code may be crashing on startup, check robot console for potential error.",
        "2. There may be no code downloaded. Deploy your code to the robot."
    ];

const JOYSTICK_ERROR =
    ["No joysticks were identified",
        "1. Ensure they are plugged in",
        "2. Disconnect and reconnect the joysticks"
    ]

const stdoutStyle = {
    width: "330px",
    height: "200px",
    color: "#fff"
}

const itemStyle = {
    minHeight: "20px"
};

class RobotConsole extends React.Component<Props, any> {
    private readonly listRef = React.createRef<HTMLDivElement>();

    constructor(props: Props) {
        super(props);

        this.listRef = React.createRef();
    }

    async componentDidMount(): Promise<void> {
        await invoke("start_stdout")
        listen<string>("sdout-message", (event) => {
            console.log(event)
        })
    }

    componentDidUpdate() {
        if (this.props.enabled) {
            let node = this.listRef.current;
            if (node) {
                node.scrollIntoView({ behavior: "auto" });
            }
        }
    }

    describeError() {
        let err = this.props.explanation;

        let data;
        switch (err) {
            case ErrorExplanation.Comms:
                data = COMMS_ERROR;
                break;
            case ErrorExplanation.Code:
                data = CODE_ERROR;
                break;
            case ErrorExplanation.Joysticks:
                data = JOYSTICK_ERROR;
                break;
        }

        // data will always be initialized here but typescript isn't smart enough to realize
        // @ts-ignore
        let items = data.map(msg => (
            <div style={itemStyle}>{msg}</div>
        ));
        // @ts-ignore
        let len: number = data.length;

        return (
            <InfiniteScroll next={() => {}} hasMore={false} loader={""} dataLength={len}
                style={stdoutStyle} className="form-control bg-secondary mt-4">
                {items}
            </InfiniteScroll>
        )
    }

    render() {
        if (this.props.explanation != null) {
            return this.describeError();
        } else {
            return (
                <InfiniteScroll next={() => {}} hasMore={false} loader={""} dataLength={this.props.messages.length}
                    style={stdoutStyle} className="form-control bg-secondary mt-4">
                    {this.props.messages.map(msg => (
                        <div style={itemStyle}>{msg}</div>
                    ))}
                    <div ref={this.listRef} />
                </InfiniteScroll>
            )
        }
    }
}

export default connector(RobotConsole);