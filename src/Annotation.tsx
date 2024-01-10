// SPDX-License-Identifier: GPL-3.0-or-later

import { createEffect, createSignal, onMount } from "solid-js";
import * as d3 from "d3";

export default function Annotation(props: any) {

    let gRef!: SVGGElement;

    const line1 = () => props.line1;

    const [xRect, setXRect] = createSignal(0);
    const [yRect, setYRect] = createSignal(0);
    const [wRect, setWRect] = createSignal(0);
    const [hRect, setHRect] = createSignal(0);

    const [xLineStart, setXLineStart] = createSignal(0);
    const [yLineStart, setYLineStart] = createSignal(0);
    const [xLineEnd, setXLineEnd] = createSignal(0);
    const [yLineEnd, setYLineEnd] = createSignal(0);

    createEffect(() => {
        line1();
        let g = d3.select(gRef).node() as SVGGraphicsElement;
        let box = g.getBBox();
        setWRect(box.width + 4);
        setHRect(box.height + 2);

        switch (props.direction) {
            case "top":
                setXLineStart(props.x);
                setYLineStart(props.y - 4);
                setXLineEnd(props.x);
                setYLineEnd(props.y - props.length);
                setXRect(props.x - 0.5 * wRect());
                setYRect(props.y - props.length - hRect() - 2);
                break;
            case "topRight":
                setXLineStart(props.x + 2.5);
                setYLineStart(props.y - 2.5);
                setXLineEnd(props.x + props.length / 1.4);
                setYLineEnd(props.y - props.length / 1.4);
                setXRect(props.x + props.length / 1.4);
                setYRect(props.y - props.length / 1.4 - hRect());
                break;
            case "right":
                setXLineStart(props.x + 4);
                setYLineStart(props.y);
                setXLineEnd(props.x + props.length);
                setYLineEnd(props.y);
                setXRect(props.x + props.length + 2);
                setYRect(props.y - 0.5 * hRect());
                break;
            case "bottomRight":
                setXLineStart(props.x + 2.5);
                setYLineStart(props.y + 2.5);
                setXLineEnd(props.x + props.length / 1.4);
                setYLineEnd(props.y + props.length / 1.4);
                setXRect(props.x + props.length / 1.4);
                setYRect(props.y + props.length / 1.4);
                break;
            case "bottom":
                setXLineStart(props.x);
                setYLineStart(props.y + 4);
                setXLineEnd(props.x);
                setYLineEnd(props.y + props.length);
                setXRect(props.x - 0.5 * wRect());
                setYRect(props.y + props.length + 2);
                break;
            case "bottomLeft":
                setXLineStart(props.x - 2.5);
                setYLineStart(props.y + 2.5);
                setXLineEnd(props.x - props.length / 1.4);
                setYLineEnd(props.y + props.length / 1.4);
                setXRect(props.x - props.length / 1.4 - wRect());
                setYRect(props.y + props.length / 1.4);
                break;
            case "left":
                setXLineStart(props.x - 4);
                setYLineStart(props.y);
                setXLineEnd(props.x - props.length);
                setYLineEnd(props.y);
                setXRect(props.x - props.length - wRect() - 2);
                setYRect(props.y - 0.5 * hRect());
                break;
            case "topLeft":
                setXLineStart(props.x - 2.5);
                setYLineStart(props.y - 2.5);
                setXLineEnd(props.x - props.length / 1.4);
                setYLineEnd(props.y - props.length / 1.4);
                setXRect(props.x - props.length / 1.4 - wRect());
                setYRect(props.y - props.length / 1.4 - hRect());
                break;

            default:
                break;
        }

    });

    return (
        <>
            <circle
                fill="none"
                stroke="#000000"
                stroke-width="0.5"
                cx={props.x}
                cy={props.y}
                r="2" />
            <line stroke="#777777"
                stroke-width="1"
                x1={xLineStart()}
                y1={yLineStart()}
                x2={xLineEnd()}
                y2={yLineEnd()}
            ></line>

            <rect
                style="fill:#E6E6FA"
                rx="2"
                x={xRect()}
                y={yRect()}
                width={wRect()}
                height={hRect()}
            />

            <g ref={gRef}>
                <text
                    font-size="0.5em"
                    fill="black"
                    x={xRect()}
                    y={yRect()}
                    dy="1.1em"
                    dx="2">
                    {line1()}
                </text>
                <text
                    font-size="0.5em"
                    fill="black"
                    x={xRect()}
                    y={yRect()}
                    dy="2.2em"
                    dx="2">
                    {props.line2}
                </text>
                <text
                    font-size="0.5em"
                    fill="black"
                    x={xRect()}
                    y={yRect()}
                    dy="3.3em"
                    dx="2">
                    {props.line3}
                </text>
            </g>
        </>

    )
}