// SPDX-License-Identifier: GPL-3.0-or-later

import { timestamp_format } from "./calculate";

export default function Annotation(props: any) {

    let angle = 150 * (Math.PI / 180);
    let radius = 20;

    let text = props.text;
    let deltaY = -2;

    if (text == "CHARGE" || text == "DROP" || text == "ROR_TP" || text == "FC_END" || text == "SC_END") {
        angle = 30 * (Math.PI / 180);
        deltaY = 36;
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

            <foreignObject width="100%" height="100%" pointer-events="none"
                x={toX}
                y={toY - deltaY}
            >
                <div class="absolute shadow-[1px_1px_0px_0px] shadow-gray-500 bg-white border rounded-sm text-[8px] p-0.5 pb-0 leading-tight"               >
                    <div>{text}</div>
                    <div>{timestamp_format(props.timestamp)}</div>
                    <div>{props.value}</div>
                </div>
            </foreignObject>
        </>

    )
}