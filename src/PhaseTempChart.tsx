// SPDX-License-Identifier: GPL-3.0-or-later

import { For, onMount } from "solid-js";
import * as d3 from "d3";
import { appStateSig } from "./AppState";

export default function PhaseTempChart() {

    const [appState, _setAppState] = appStateSig;
    const [dryingPhase, _setDryingPhase] = appState().dryingPhaseSig;
    const [maillardPhase, _setMaillardPhase] = appState().maillardPhaseSig;
    const [developPhase, _setDevelopPhase] = appState().developPhaseSig;

    let data = [
        { id: "Dry", phase: dryingPhase },
        { id: "Mai", phase: maillardPhase },
        { id: "Dev", phase: developPhase },
    ];

    // Specify the chart’s dimensions, based on a bar’s height.
    const barHeight = 20;
    const marginTop = 0;
    const marginRight = 30;
    const marginBottom = 20;
    const marginLeft = 30;
    const width = 360;
    const height = Math.ceil((data.length + 0.1) * barHeight) + marginTop + marginBottom;

    // Create the scales.
    const x = d3.scaleLinear()
        .domain([0, 60])
        .range([marginLeft, width - marginRight]);

    const y = d3.scaleBand()
        .domain(data.map((d: { id: any; }) => d.id))
        .rangeRound([marginTop, height - marginBottom])
        .padding(0.15);

    let svgRef: SVGSVGElement | undefined;

    onMount(() => {
        if (svgRef) {

            const svg = d3.select(svgRef);

            // Create the axes.
            svg.append("g")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .call(d3.axisBottom(x).ticks(10).tickFormat((d) => (d + "°")));

            svg.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(d3.axisLeft(y))
                .select(".domain").remove();
        }
    });

    return (
        <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox={`0 0 ${width} ${height}`} height={height}>
            {/* Add a rect for each bar. */}
            <For each={data}>{
                (d) => (<>
                    <rect
                        fill="#FF8C00"
                        x={x(0)}
                        y={y(d.id)}
                        width={x(d.phase().temp_rise) - x(0)}
                        height={y.bandwidth()}
                    />
                    <g
                        text-anchor="start">
                        <text
                            x={x(d.phase().temp_rise)}
                            y={y(d.id) as number + y.bandwidth() / 2}
                            dy="0.35em"
                            dx="4"
                            font-size="0.8em">
                            {d.phase().temp_rise.toFixed(1) + "°"}
                        </text>
                    </g>
                </>)
            }
            </For >
        </svg >
    );
}