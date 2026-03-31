import React from "react";
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import { InputItem } from "@components/input/InputItem";
import { InputTester } from "@components/input/inputTester";
import { InputState } from "@lib/ipc-new";
// import { invoke } from "@tauri-apps/api/core";
// import { listen } from "@tauri-apps/api/event";


type PageState = InputState;

class InputPage extends React.Component<any, PageState> {
    constructor(props: any) {
        super(props)
        this.state = { devices: [ { uniqueId: "sdfjuhskdjfn", deviceId: 0, name: "Unbound"}], mappings: []}
        this.onDragEnd = this.onDragEnd.bind(this)
    }

    onDragEnd(result: DropResult) {
        if (!result.destination) {
            return;
        }
    }

    render() {
        return (<div className="container">
            <div className="row py-2">
                <div className="row m-auto">
                    <div className="col col-3">
                        <p className="text-light text-center mb-0">Connected Input Sources</p>
                        <DragDropContext onDragEnd={this.onDragEnd}>
                            <Droppable droppableId="joysticksList">
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}>
                                        {this.state.devices.map((device, index) => (<InputItem device={device} key={index} deviceIndex={index} mappings={this.state.mappings}/>))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                    <div className="col col-9">
                        <p className="text-light text-center mb-0">Input Tester</p>
                        <InputTester></InputTester>
                    </div>
                </div>
            </div>
        </div>);
    }
}

export default InputPage