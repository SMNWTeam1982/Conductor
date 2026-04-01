import React from "react";
import { Draggable } from '@hello-pangea/dnd';
import { InputDevice } from "@lib/ipc";

export type JoystickData = {
    name: string;
    id: string;
}

type ComponentProps = {
    device: InputDevice;
    deviceIndex: number;
    mappings: {
        uuid: string;
        position: number;
    }[]
};

export class InputItem extends React.Component<ComponentProps, any> {
    render() {
        return (
            <Draggable key={this.props.device.uniqueId} draggableId={this.props.device.uniqueId} index={this.props.deviceIndex}>
                    {(provided) => (<div className="rounded bg-light-subtle d-flex border border-light-subtle text-light m-1 justify-content-center align"
                        key={this.props.device.uniqueId}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}>
                        <p className="text-center m-2">{this.props.device.deviceId}: {this.props.device.name}</p>
                    </div>)}
                {/* {(provided) => ( */}
                {/* )} */}
            </Draggable>
        );
    }
}