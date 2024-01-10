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

    let x = props.x;
    let y = props.y;
    let length = props.length;

    createEffect(() => {
        line1();
        let g = d3.select(gRef).node() as SVGGraphicsElement;
        let box = g.getBBox();
        setWRect(box.width + 4);
        setHRect(box.height + 2);

        switch (props.direction) {
            case "top":
                setXLineStart(x);
                setYLineStart(y - 4);
                setXLineEnd(x);
                setYLineEnd(y - length);
                setXRect(x - 0.5 * wRect());
                setYRect(y - length - hRect() - 2);
                break;
            case "topRight":
                setXLineStart(x + 2.5);
                setYLineStart(y - 2.5);
                setXLineEnd(x + length / 1.4);
                setYLineEnd(y - length / 1.4);
                setXRect(x + length / 1.4);
                setYRect(y - length / 1.4 - hRect());
                break;
            case "right":
                setXLineStart(x + 4);
                setYLineStart(y);
                setXLineEnd(x + length);
                setYLineEnd(y);
                setXRect(x + length + 2);
                setYRect(y - 0.5 * hRect());
                break;
            case "bottomRight":
                setXLineStart(x + 2.5);
                setYLineStart(y + 2.5);
                setXLineEnd(x + length / 1.4);
                setYLineEnd(y + length / 1.4);
                setXRect(x + length / 1.4);
                setYRect(y + length / 1.4);
                break;
            case "bottom":
                setXLineStart(x);
                setYLineStart(y + 4);
                setXLineEnd(x);
                setYLineEnd(y + length);
                setXRect(x - 0.5 * wRect());
                setYRect(y + length + 2);
                break;
            case "bottomLeft":
                setXLineStart(x - 2.5);
                setYLineStart(y + 2.5);
                setXLineEnd(x - length / 1.4);
                setYLineEnd(y + length / 1.4);
                setXRect(x - length / 1.4 - wRect());
                setYRect(y + length / 1.4);
                break;
            case "left":
                setXLineStart(x - 4);
                setYLineStart(y);
                setXLineEnd(x - length);
                setYLineEnd(y);
                setXRect(x - length - wRect() - 2);
                setYRect(y - 0.5 * hRect());
                break;
            case "topLeft":
                setXLineStart(x - 2.5);
                setYLineStart(y - 2.5);
                setXLineEnd(x - length / 1.4);
                setYLineEnd(y - length / 1.4);
                setXRect(x - length / 1.4 - wRect());
                setYRect(y - length / 1.4 - hRect());
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