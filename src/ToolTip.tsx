// SPDX-License-Identifier: GPL-3.0-or-later

import { createEffect, createSignal } from "solid-js";
import * as d3 from "d3";

export default function ToolTip(props: any) {

    let textRef!: SVGTextElement;

    const value = () => props.text;

    const [w, setW] = createSignal(0);
    const [h, setH] = createSignal(0);

    createEffect(() => {
        value();
        let text = d3.select(textRef).node() as SVGGraphicsElement;
        let box = text.getBBox();
        setW(box.width + 4);
        setH(box.height);

    });

    return (
        <>
            <circle
                fill={props.color}
                stroke={props.color}
                stroke-width="0.5"
                cx={props.x}
                cy={props.y}
                r="2" />

            <line stroke="black"
                opacity={0.5}
                stroke-width="0.5"
                x1={props.x + 3}
                y1={props.y - 2}
                x2={props.x + 12}
                y2={props.y - 6}
            ></line>

            <rect
                style="fill:#E6E6FA"
                rx="2"
                x={props.x + 12 + 2}
                y={props.y - h() - 6}
                width={w()}
                height={h()}
            />

            <text ref={textRef}
                font-size="0.8em"
                fill={props.color}
                x={props.x + 12}
                y={props.y - h() / 2 - 6}
                dy="0.4em"
                dx="4">
                {value()}
            </text>

        </>

    )
}
