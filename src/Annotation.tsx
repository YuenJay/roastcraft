// SPDX-License-Identifier: GPL-3.0-or-later

import { timestamp_format } from "./calculate";

export default function Annotation(props: any) {



    let angle = 150 * (Math.PI / 180);
    let radius = 30;

    let text = props.text;

    let dy_base = "1.1em";

    if (text == "CHARGE" || text == "DROP" || text == "ROR_TP" || text == "FC_END" || text == "SC_END") {
        angle = 30 * (Math.PI / 180);
        dy_base = "-2.2em"
    }

    let fromX = props.x + Math.sin(angle) * radius * 0.2;
    let fromY = props.y - Math.cos(angle) * radius * 0.2;

    let toX = fromX + Math.sin(angle) * radius;
    let toY = fromY - Math.cos(angle) * radius;

    return (
        <>
            <line stroke="#000000"
                stroke-width="1"
                clip-path="url(#clip-path)"
                x1={fromX}
                y1={fromY}
                x2={toX}
                y2={toY}
            ></line>
            <text
                stroke="#000000"
                font-size="0.6em"
                x={toX}
                y={toY}>
                <tspan x={toX} dy={dy_base}>{text}</tspan>
                <tspan x={toX} dy="1.1em">{timestamp_format(props.timestamp)}</tspan>
                <tspan x={toX} dy="1.1em">{props.value}</tspan>
            </text>
        </>

    )
}