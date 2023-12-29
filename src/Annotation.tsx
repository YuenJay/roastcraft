// SPDX-License-Identifier: GPL-3.0-or-later

import { createEffect, createSignal, onMount } from "solid-js";
import * as d3 from "d3";
import { timestamp_format } from "./calculate";

export default function Annotation(props: any) {

    let gRef!: SVGGElement;

    const text = () => props.text;

    const [w, setW] = createSignal(0);
    const [h, setH] = createSignal(0);

    let length = 20;

    let upward = true;

    if (props.text == "TP" || props.text == "DRY_END" || props.text == "FC_START" || props.text == "SC_START") {
        upward = false;
    }

    createEffect(() => {
        text();
        let g = d3.select(gRef).node() as SVGGraphicsElement;
        let box = g.getBBox();
        setW(box.width + 4);
        setH(box.height);

    });

    return (
        <>
            <circle
                fill="none"
                stroke="#000000"
                stroke-width="1"
                cx={props.x}
                cy={props.y}
                r="2" />
            <line stroke="#777777"
                stroke-width="1"
                x1={props.x}
                y1={upward ? props.y - 4 : props.y + 4}
                x2={props.x}
                y2={upward ? props.y - length : props.y + length}
            ></line>

            <rect
                style="fill:#E6E6FA"
                rx="2"
                x={props.x - 0.5 * w()}
                y={upward ? props.y - length - h() - 2 : props.y + length + 2}
                width={w()}
                height={h()}
            />

            <g ref={gRef}>
                <text
                    font-size="0.5em"
                    fill="black"
                    x={props.x - 0.5 * w()}
                    y={upward ? props.y - length - h() - 2 : props.y + length + 2}
                    dy="1em"
                    dx="2">
                    {text()}
                </text>
                <text
                    font-size="0.5em"
                    fill="black"
                    x={props.x - 0.5 * w()}
                    y={upward ? props.y - length - h() - 2 : props.y + length + 2}
                    dy="2em"
                    dx="2">
                    {timestamp_format(props.timestamp)}
                </text>
                <text
                    font-size="0.5em"
                    fill="black"
                    x={props.x - 0.5 * w()}
                    y={upward ? props.y - length - h() - 2 : props.y + length + 2}
                    dy="3em"
                    dx="2">
                    {props.value}
                </text>
            </g>
        </>

    )
}