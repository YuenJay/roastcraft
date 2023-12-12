// SPDX-License-Identifier: GPL-3.0-or-later

import { createEffect, createSignal, onMount } from "solid-js";
import { timestamp_format } from "./calculate";

export default function Annotation(props: any) {

    let divRef!: HTMLDivElement;

    const [w, setW] = createSignal(0);
    const [h, setH] = createSignal(0);

    let length = 20;

    let text = props.text;

    let upward = true;

    if (text == "TP" || text == "DRY_END" || text == "FC_END" || text == "SC_END") {
        upward = false;
    }

    onMount(() => {
        setW(divRef.getBoundingClientRect().width);
        setH(divRef.getBoundingClientRect().height);
    });

    return (
        <>
            <line stroke="#777777"
                stroke-width="1"
                x1={props.x}
                y1={upward ? props.y - 4 : props.y + 4}
                x2={props.x}
                y2={upward ? props.y - length : props.y + length}
            ></line>

            <foreignObject width={`${w()}px`} height={`${h()}px`} pointer-events="none"
                x={props.x - 0.4 * w()}
                y={upward ? props.y - length - h() + 6 : props.y + length + 2}
            >
                <div ref={divRef} class="absolute shadow-[1px_1px_0px_0px] shadow-gray-500 bg-white border rounded-sm text-[8px] p-0.5 pb-0 leading-tight">
                    <div>{text}</div>
                    <div>{timestamp_format(props.timestamp)}</div>
                    <div>{props.value}</div>
                </div>
            </foreignObject>
        </>

    )
}