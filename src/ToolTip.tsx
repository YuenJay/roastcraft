// SPDX-License-Identifier: GPL-3.0-or-later

import { createEffect, createSignal } from "solid-js";
import * as d3 from "d3";

export default function ToolTip(props: any) {

    let textRef!: SVGTextElement;

    const value = () => props.text;

    const [w, setW] = createSignal(0);
    const [h, setH] = createSignal(0);

    let deltaX = 12;
    let deltaY = -6;

    createEffect(() => {
        value();
        let text = d3.select(textRef).node() as SVGGraphicsElement;
        let box = text.getBBox();
        setW(box.width + 2);
        setH(box.height);

    });

    return (
        <>
            <line stroke="black"
                opacity={0.5}
                stroke-width="0.5"
                x1={props.x}
                y1={props.y}
                x2={props.x + deltaX}
                y2={props.y + deltaY}
            ></line>

            <circle
                fill={props.color}
                stroke={props.color}
                stroke-width="0.5"
                cx={props.x}
                cy={props.y}
                r="2" />

            <rect
                fill="#E6E6FA"
                rx="2"
                x={props.x + deltaX + 1}
                y={props.y - h() + deltaY}
                width={w()}
                height={h()}
            />

            <text ref={textRef}
                font-size="0.7em"
                fill={props.color}
                x={props.x + deltaX}
                y={props.y - h() / 2 + deltaY}
                dy="0.4em"
                dx="2">
                {value()}
            </text >

        </>

    )
}
