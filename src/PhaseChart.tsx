// SPDX-License-Identifier: GPL-3.0-or-later

import { For, Show, createEffect, createSignal, onMount } from "solid-js";
import * as d3 from "d3";
import { appStateSig } from "./AppState";

function timestamp_format(timestamp: number) {
    return Math.floor(timestamp / 60).toString() + ":" + (timestamp % 60).toString().padStart(2, '0');
}

export default function PhaseChart(props: any) {

    // let data = 
    // [
    //     { id: "G", dry: ghost().dryingPhase, mai: ghost().maillardPhase, dev: ghost().developPhase },
    //     { id: "#", dry: dryingPhase(), mai: maillardPhase(), dev: developPhase() },
    // ]

    const [appState, _setAppState] = appStateSig;
    const [phaseChartWidth, _setPhaseChartWidth] = appState().phaseChartWidthSig;

    // Specify the chart’s dimensions, based on a bar’s height.
    const barHeight = 36;
    const marginTop = 0;
    const marginRight = 64;
    const marginBottom = 20;
    const marginLeft = 10;
    // const width = 360;
    const height = Math.ceil((props.data.length + 0.1) * barHeight) + marginTop + marginBottom;

    // Create the scales.
    let x = d3.scaleLinear()
        .domain([0, 100])
        .range([marginLeft, phaseChartWidth() - marginRight]);

    const y = d3.scaleBand()
        .domain(props.data.map((d: { id: any; }) => d.id))
        .rangeRound([marginTop, height - marginBottom])
        .padding(0.1);

    let svgRef: SVGSVGElement | undefined;
    let xAxisRef: SVGGElement | undefined;
    onMount(() => {
        if (svgRef) {

            const svg = d3.select(svgRef);

            svg.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(d3.axisLeft(y).tickSize(0))
                .select(".domain").remove();
        }
    });

    createEffect(() => {
        // Create the axes.
        if (xAxisRef) {
            x = x.range([marginLeft, phaseChartWidth() - marginRight]);
            d3.select(xAxisRef)
                .call(d3.axisBottom(x).ticks(5).tickFormat((d) => (d + "%")));
        }
    });

    return (

        <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox={`0 0 ${phaseChartWidth()} ${height}`} height={height}>
            <g ref={xAxisRef} transform={`translate(0,${height - marginBottom})`}></g>
            <defs>
                {/* Defines clipping area, rect is inside axis*/}
                <clipPath
                    clipPathUnits="userSpaceOnUse"
                    id="phaseChart">
                    <rect x={marginLeft} y={marginTop} width={phaseChartWidth() - marginLeft - marginRight} height={height - marginTop - marginBottom} />
                </clipPath>
            </defs>

            <For each={props.data}>{
                (d) => (<>

                    <Show when={d.dry.percent > 0}>
                        <rect
                            opacity={d.id == "#" ? 1 : 0.8}
                            fill="#22c55e"
                            x={x.range([marginLeft, phaseChartWidth() - marginRight])(0)}
                            y={y(d.id)}
                            width={x(d.dry.percent) - x(0)}
                            height={y.bandwidth()}
                        />
                        <g
                            fill="black"
                            text-anchor="start">
                            <text
                                x={x.range([marginLeft, phaseChartWidth() - marginRight])(0)}
                                y={y(d.id) as number + y.bandwidth() / 2}
                                dy="-2"
                                dx="2"
                                font-size="0.8em">
                                {d.dry.percent.toFixed(1) + "%"}
                            </text>
                            <text
                                x={x.range([marginLeft, phaseChartWidth() - marginRight])(0)}
                                y={y(d.id) as number + y.bandwidth() / 2}
                                dy="1em"
                                dx="2"
                                font-size="0.8em">
                                {timestamp_format(d.dry.time) + ", " + d.dry.temp_rise.toFixed(1) + "°"}
                            </text>
                        </g>
                    </Show>
                    <Show when={d.mai.percent > 0}>
                        <rect
                            opacity={d.id == "#" ? 1 : 0.8}
                            fill="#ea580c"
                            x={x.range([marginLeft, phaseChartWidth() - marginRight])(d.dry.percent)}
                            y={y(d.id)}
                            width={x.range([marginLeft, phaseChartWidth() - marginRight])(d.mai.percent) - x(0)}
                            height={y.bandwidth()}
                        />
                        <g
                            fill="black"
                            text-anchor="start"
                            clip-path="url(#phaseChart)"
                        >
                            <text
                                x={x.range([marginLeft, phaseChartWidth() - marginRight])(d.dry.percent)}
                                y={y(d.id) as number + y.bandwidth() / 2}
                                dy="-2"
                                dx="2"
                                font-size="0.8em">
                                {d.mai.percent.toFixed(1) + "%"}
                            </text>
                            <text
                                x={x.range([marginLeft, phaseChartWidth() - marginRight])(d.dry.percent)}
                                y={y(d.id) as number + y.bandwidth() / 2}
                                dy="1em"
                                dx="2"
                                font-size="0.8em">
                                {timestamp_format(d.mai.time) + ", " + d.mai.temp_rise.toFixed(1) + "°"}
                            </text>
                        </g>
                    </Show>

                    <rect
                        opacity={d.id == "#" ? 1 : 0.8}
                        fill="#991b1b"
                        x={x.range([marginLeft, phaseChartWidth() - marginRight])(d.dry.percent + d.mai.percent)}
                        y={y(d.id)}
                        width={x(d.dev.percent) - x(0)}
                        height={y.bandwidth()}
                    />
                    <g
                        fill="black"
                        text-anchor="start">
                        <text
                            x={x.range([marginLeft, phaseChartWidth() - marginRight])(100)}
                            y={y(d.id) as number + y.bandwidth() / 2}
                            dy="-2"
                            dx="2"
                            font-size="0.8em">
                            {d.dev.percent.toFixed(1) + "%"}
                        </text>
                        <text
                            x={x.range([marginLeft, phaseChartWidth() - marginRight])(100)}
                            y={y(d.id) as number + y.bandwidth() / 2}
                            dy="1em"
                            dx="2"
                            font-size="0.8em">
                            {timestamp_format(d.dev.time) + ", " + d.dev.temp_rise.toFixed(1) + "°"}
                        </text>
                    </g>
                </>)
            }
            </For >
        </svg >
    );
}