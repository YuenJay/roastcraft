// SPDX-License-Identifier: GPL-3.0-or-later

import { For, onMount, } from "solid-js";
import * as d3 from "d3";
import { GET, SET, Point, appStateSig } from "./AppState";

export default function ManualChart() {

    const [appState, setAppState] = appStateSig;
    const [timer, setTimer] = appState().timerSig;
    const [cursorLineX, setCursorLineX] = appState().cursorLineXSig;
    const [manualMetrics, setManualMetrics] = appState().manualMetricsSig;

    const width = 800;
    const height = 200;
    const marginTop = 10;
    const marginRight = 30;
    const marginBottom = 20;
    const marginLeft = 30;

    let min = 0;
    let max = 100;
    let step = 5;
    let defaultValue = 20;

    let pips: number[] = [];
    for (let i = 0; i < max / step; i++) {
        pips.push(min + i * step);
    }
    pips.push(max);

    console.log(pips);

    const xScale = d3.scaleLinear(
        [-60, 720],
        [marginLeft, width - marginRight]
    );

    const yScale = d3.scaleLinear([min, max], [
        height - marginBottom,
        marginTop,
    ]);

    const line = d3.line()
        .x((d: any) => xScale(d.timestamp + appState().timeDeltaSig[GET]()))
        .y((d: any) => yScale(d.value))
        .curve(d3.curveStepAfter);

    let svgRef: SVGSVGElement | undefined;

    onMount(() => {
        if (svgRef) {

            const svg = d3.select(svgRef);
            svg.append("g")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .call(d3.axisBottom(xScale));

            svg.append("g")
                .attr("transform", `translate(${marginLeft}, 0)`)
                .call(d3.axisLeft(yScale));

            svg.on("mousemove", (event) => {
                setCursorLineX(d3.pointer(event)[0]);
                // console.log(xScale.invert(d3.pointer(event)[0]));
            });
        }
    });

    async function handleInput(event: InputEvent) {

        let value = (event.target as HTMLInputElement).value;
        console.log(value);

        manualMetrics()[0].currentDataSig[SET](Number(value));
        manualMetrics()[0].dataSig[SET](
            [...manualMetrics()[0].dataSig[GET](), new Point(timer(), Number(value))]
        );

    }

    return (
        <>
            <div>GAS</div>
            <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox="0 0 800 200" >
                <defs>
                    {/* Defines clipping area, rect is inside axis*/}
                    <clipPath
                        clipPathUnits="userSpaceOnUse"
                        id="clip-path-input-0">
                        <rect x={marginLeft} y={marginTop} width={width - marginLeft - marginRight} height={height - marginTop - marginBottom} />
                    </clipPath>
                </defs>
                <path
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    d={line(
                        [...manualMetrics()[0].dataSig[GET](), { timestamp: timer(), value: manualMetrics()[0].currentDataSig[GET]() }] as any
                    ) as string | undefined}
                />
                <line stroke="#00FF00"
                    stroke-width="1"
                    clip-path="url(#clip-path-input-0)"
                    x1={cursorLineX()}
                    y1={marginTop}
                    x2={cursorLineX()}
                    y2={height - marginBottom}
                ></line>
            </svg>
            <input
                type="range"
                class="range range-primary range-xs"
                min={min}
                max={max}
                value={defaultValue}
                step={step}
                onInput={handleInput}
            />
            <div class="w-full flex justify-between text-xs px-2 pb-4">
                <For each={pips}>
                    {(pip) => (
                        <span class="h-2 w-px bg-black">
                            <span class="absolute -translate-x-1/2 translate-y-1/2" >{pip}</span>
                        </span>
                    )}
                </For>

            </div>
        </>
    );
}