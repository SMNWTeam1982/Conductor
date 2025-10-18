import { ACKNOWLEDGE_WARNING, type DriverStationState } from "@lib/store";
import { invoke } from "@tauri-apps/api/core";
import React from "react";
import { connect, type ConnectedProps } from "react-redux";

const mapState = (state: DriverStationState) => ({
    warningAck: state.warningAcknowledged,
});

const mapDispatch = {
    ackWarning: () => ({ type: ACKNOWLEDGE_WARNING }),
}

function acknowledgeWarning(props: Props) {
    invoke('get_warning_ack').then((warningAck) => {
        console.log(warningAck)
        if (!warningAck || !props.warningAck) {
            invoke('acknowledge_warning');
            props.ackWarning()
        }
    });
}

const connectWarningState = connect(mapState, mapDispatch);

type Props = ConnectedProps<typeof connectWarningState>;

class KeybindWarning extends React.Component<Props> {
    render(): React.ReactNode {
        return (
            <div className="row align-content-center bg-transparent">
                <div className="col align-content-center">
                    <div className="card bg-danger">
                        <div className="card-body">
                            <h4 className="card-title text-light fw-bold">Warning: Global Hotkeys Unavailable</h4>
                            <p className="card-text text-light">
                                Conductor Driver Station <strong>cannot</strong> Disable or Emergency Stop the robot
                                if the window is out of focus. <br></br> The window must be focused for Enter and Space to work.
                            </p>
                            <a href="#" className="btn btn-lg btn-light text-danger fw-medium"
                                onClick={() => acknowledgeWarning(this.props)}>Continue</a>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default connectWarningState(KeybindWarning);