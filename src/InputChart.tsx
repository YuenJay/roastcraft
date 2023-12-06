// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, Show } from "solid-js";
import * as d3 from "d3";
import useAppStore from "./AppStore";

export default function InputChart() {

    const [appStore, setAppStore] = useAppStore;

    let data = appStore.metrics[0].data;

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
        .x((d: any) => xScale(d.timestamp))
        .y((d: any) => yScale(d.value));

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

    return (
        <div>
            <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox="0 0 800 200" >
                <path
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    d={line(data as any) as string | undefined}
                />
                <g fill="white" stroke="currentColor" stroke-width="1">

                    <Show when={data.length > 0}>
                        <circle cx={xScale(data[data.length - 1].timestamp)} cy={yScale(data[data.length - 1].value)} r="2" />
                    </Show>
                </g>
            </svg>
            <input
                type="range"
                min="0"
                max="100"
                value="40"
                class="range range-primary range-xs"
                step="20"
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