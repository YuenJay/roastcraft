// SPDX-License-Identifier: GPL-3.0-or-later

import { createSignal, onMount } from "solid-js";

export enum ToolTipDirection {
    TOP,
    BOTTOM,
    LEFT,
    RIGHT
}

export default function ToolTip(props: any) {

    let divRef!: HTMLDivElement;

    const [w, setW] = createSignal(0);
    const [h, setH] = createSignal(0);

    onMount(() => {
        setW(divRef.getBoundingClientRect().width);
        setH(divRef.getBoundingClientRect().height);
    });

    if (props.direction == ToolTipDirection.TOP || props.direction == ToolTipDirection.BOTTOM) {
        let bottom = true;
        if (props.direction == ToolTipDirection.TOP) {
            bottom = false;
        }
        return (
            <>
                <circle
                    fill={props.color}
                    stroke={props.color}
                    stroke-width="1"
                    cx={props.x}
                    cy={props.y}
                    r="1.5" />
                <foreignObject width={`${w()}px`} height={`${h()}px`} pointer-events="none"
                    x={props.x - 0.4 * w()}
                    y={bottom ? props.y + 5 : props.y - h()}
                >
                    <div ref={divRef} class="absolute shadow-[1px_1px_0px_0px] shadow-gray-500 bg-gray-100 border rounded-sm text-xs p-0.5 pb-0 leading-tight"
                        style={`color: ${props.color};`}>
                        <div>{props.text}</div>
                    </div>
                </foreignObject>
            </>

        )
    } else {
        let right = true;
        if (props.direction == ToolTipDirection.LEFT) {
            right = false;
        }
        return (
            <>
                <circle
                    fill={props.color}
                    stroke={props.color}
                    stroke-width="1"
                    cx={props.x}
                    cy={props.y}
                    r="1.5" />
                <foreignObject width={`${w()}px`} height={`${h()}px`} pointer-events="none"
                    x={right ? props.x + 4 : props.x - w() + 2}
                    y={props.y - 0.4 * h()}
                >
                    <div ref={divRef} class="absolute shadow-[1px_1px_0px_0px] shadow-gray-500 bg-gray-100 border rounded-sm text-xs p-0.5 pb-0 leading-tight"
                        style={`color: ${props.color};`}>
                        <div>{props.text}</div>
                    </div>
                </foreignObject>
            </>

        )
    }
}