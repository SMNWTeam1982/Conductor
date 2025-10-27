import React from "react";
import { Draggable } from '@hello-pangea/dnd';

export type JoystickData = {
    name: string;
    id: string;
}

type JoystickProps = JoystickData & {
    index: number;
}

export class InputList extends React.Component<JoystickProps, any> {
    render() {
        return (
            <Draggable key={this.props.index} draggableId={this.props.id} index={this.props.index}>
                {(provided) => (
                    <div className="rounded bg-light-subtle d-flex border border-light-subtle text-light m-1 justify-content-center align"
                        key={this.props.index}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}>
                        <p className="text-center m-2">{this.props.index}: {this.props.name}</p>
                    </div>
                )}
            </Draggable>
        );
    }
}