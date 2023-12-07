// SPDX-License-Identifier: GPL-3.0-or-later

import { createSignal, onMount, Show } from "solid-js";
import * as d3 from "d3";
import useAppStore, { Metric, Point, useManualMetrics } from "./AppStore";
import { produce } from "solid-js/store";

export default function InputChart() {

    const [appStore, setAppStore] = useAppStore;

    const [manualMetrics, setManualMetrics] = useManualMetrics;

    const width = 800;
    const height = 200;
    const marginTop = 10;
    const marginRight = 30;
    const marginBottom = 20;
    const marginLeft = 30;

    const xScale = d3.scaleLinear(
        [-60, 720],
        [marginLeft, width - marginRight]
    );

    const yScale = d3.scaleLinear([0, 120], [
        height - marginBottom,
        marginTop,
    ]);

    const line = d3.line()
        .x((d: any) => xScale(d.timestamp + appStore.time_delta))
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
        }
    });

    async function handleInput(event: InputEvent) {

        let value = (event.target as HTMLInputElement).value;
        console.log(value);

        setManualMetrics(
            produce((manualMetrics) => {
                manualMetrics[0].data.push(
                    new Point(appStore.timer, Number(value))
                );
            })
        );

        console.log(manualMetrics);

    }

    return (
        <div>
            <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox="0 0 800 200" >
                <path
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    d={line(manualMetrics[0].data as any) as string | undefined}
                />

            </svg>
            <input
                type="range"
                min="0"
                max="100"
                value="40"
                class="range range-primary range-xs"
                step="20"
                onInput={handleInput}
            />
            <div class="w-full flex justify-between text-xs px-2 pb-4">
                <span class="h-2 w-px bg-black">
                    <span class="absolute -translate-x-1/2 translate-y-1/2">0</span>
                </span>
                <span class="h-2 w-px bg-black">
                    <span class="absolute -translate-x-1/2 translate-y-1/2">20</span>
                </span>
                <span class="h-2 w-px bg-black">
                    <span class="absolute -translate-x-1/2 translate-y-1/2">40</span>
                </span>
                <span class="h-2 w-px bg-black">
                    <span class="absolute -translate-x-1/2 translate-y-1/2">60</span>
                </span>
                <span class="h-2 w-px bg-black">
                    <span class="absolute -translate-x-1/2 translate-y-1/2">80</span>
                </span>
                <span class="h-2 w-px bg-black">
                    <span class="absolute -translate-x-1/2 translate-y-1/2">100</span>
                </span>
            </div>
        </div>
    );
}