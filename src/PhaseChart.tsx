// SPDX-License-Identifier: GPL-3.0-or-later

import { For, Show, onMount } from "solid-js";
import * as d3 from "d3";

function timestamp_format(timestamp: number) {
    return Math.floor(timestamp / 60).toString() + ":" + (timestamp % 60).toString().padStart(2, '0');
}

export default function PhaseChart(props: any) {

    // Specify the chart’s dimensions, based on a bar’s height.
    const barHeight = 20;
    const marginTop = 0;
    const marginRight = 30;
    const marginBottom = 20;
    const marginLeft = 30;
    const width = 360;
    const height = Math.ceil((props.data.length + 0.1) * barHeight) + marginTop + marginBottom;

    // Create the scales.
    const x = d3.scaleLinear()
        .domain([0, 100])
        .range([marginLeft, width - marginRight]);

    const y = d3.scaleBand()
        .domain(props.data.map((d: { id: any; }) => d.id))
        .rangeRound([marginTop, height - marginBottom])
        .padding(0.15);

    let svgRef: SVGSVGElement | undefined;

    onMount(() => {
        if (svgRef) {

            const svg = d3.select(svgRef);

            // Create the axes.
            svg.append("g")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .call(d3.axisBottom(x).ticks(10).tickFormat((d) => (d + "%")));

            svg.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(d3.axisLeft(y))
                .select(".domain").remove();
        }
    });

    return (

        <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox={`0 0 ${width} ${height}`} height={height}>

            {/* Add a rect for each bar. */}
            <For each={props.data}>{
                (d) => (<>

                    <rect
                        fill="#4682B4"
                        x={x(0)}
                        y={y(d.id)}
                        width={x(d.phase().percent) - x(0)}
                        height={y.bandwidth()}
                    />

                    <Show when={d.phase().percent < 80}
                        fallback={
                            <g
                                fill="white"
                                text-anchor="end">
                                <text
                                    x={x(d.phase().percent)}
                                    y={y(d.id) as number + y.bandwidth() / 2}
                                    dy="0.35em"
                                    dx="-4"
                                    font-size="0.8em">
                                    {d.phase().percent.toFixed(1) + "%"}
                                </text>
                            </g>
                        }>
                        <g
                            text-anchor="start">
                            <text
                                x={x(d.phase().percent)}
                                y={y(d.id) as number + y.bandwidth() / 2}
                                dy="0.35em"
                                dx="4"
                                font-size="0.8em">
                                {d.phase().percent.toFixed(1) + "%"}
                            </text>
                        </g>
                    </Show>
                    <g
                        text-anchor="start">
                        <text
                            x={x(100)}
                            y={y(d.id) as number + y.bandwidth() / 2}
                            dy="0.35em"
                            dx="4"
                            font-size="0.8em">
                            {timestamp_format(d.phase().time)}
                        </text>
                    </g>
                </>)
            }
            </For >
        </svg >
    );
}