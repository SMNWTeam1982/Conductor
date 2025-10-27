import React from "react";
// import { Joystick } from 'react-joystick-component';
// import * as Icons from "@assets/gamepad/icons";

export class InputTester extends React.Component<any, any> {
    render(): React.ReactNode {
        return (
            <div>
                <p className="text-light text-center"> This feature is not yet implemented</p>
                {/* <div className="row">

                    <div className="col justify-content-center d-flex position-relative align-content-center">
                        <div className="position-absolute translate-middle top-25 start-25" >
                        <Icons.CircleButtonOutline viewBox="0 0 50 50" width="100px" height="100px"/>
                        </div>
                        <div className="position-absolute translate-middle top-50 start-50">
                            <Joystick baseColor="" />
                        </div>
                    </div>

                    <div className="col justify-content-center d-flex">
                        <div className="relative w-[600px] h-[400px]">
                            <div className="absolute left-[200px] top-[250px]">
                                <Joystick />
                            </div>
                        </div>
                    </div>
                </div> */}
            </div>
        )
    }
}