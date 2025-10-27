import { type DriverStationState, REORDER_JOYSTICKS, UPDATE_JOYSTICK_MAPPING_INTERNAL } from "@lib/store";
import { connect, type ConnectedProps } from "react-redux";
import React from "react";
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import { InputList, type JoystickData } from "@components/input/InputList";
import { InputTester } from "@components/input/inputTester";

const mapState = (state: DriverStationState) => ({
    joysticks: state.joysticks,
    mappings: state.joystickMappings
})

const mapDispatch = {
    updateList: (js: JoystickData, startIdx: number, endIdx: number) => ({ type: REORDER_JOYSTICKS, js: js, oldIdx: startIdx, newIdx: endIdx }),
    updateMapping: (name: string, pos: number, uuid: string) => ({ type: UPDATE_JOYSTICK_MAPPING_INTERNAL, name: name, pos: pos, uuid: uuid })
}

const connector = connect(mapState, mapDispatch);

type Props = ConnectedProps<typeof connector>;

class InputPage extends React.Component<Props, any> {
    constructor(props: Props) {
        super(props)
        this.onDragEnd = this.onDragEnd.bind(this)
    }

    onDragEnd(result: DropResult) {
        if (!result.destination) {
            return;
        }

        this.props.updateList(this.props.joysticks[result.source.index], result.source.index, result.destination.index)
        this.props.updateMapping(this.props.joysticks[result.source.index].name, result.destination.index, this.props.joysticks[result.source.index].id);
    }

    render() {
        return (<div className="container">
            <div className="row py-2">
                <div className="row m-auto">
                    <div className="col col-3">
                        <p className="text-light text-center mb-0">Connected Input Sources</p>
                        <DragDropContext onDragEnd={this.onDragEnd}>
                            <Droppable droppableId="joysticksList">
                                {(provided: any) => (
                                    <div
                                        key={provided.index}
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}>
                                        {this.props.joysticks.map((data, index) => (<InputList key={data.id} {...data} index={index} />))}
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

export default connector(InputPage)