// SPDX-License-Identifier: GPL-3.0-or-later

import { For, onMount } from "solid-js";
import * as d3 from "d3";

export default function PhaseChart(props: any) {

    let data = [
        { id: "Dry", value: 30.123 },
        { id: "Mai", value: 46.167 },
        { id: "Dev", value: 51.367 },
    ];

    // Specify the chart’s dimensions, based on a bar’s height.
    const barHeight = 20;
    const marginTop = 0;
    const marginRight = 20;
    const marginBottom = 20;
    const marginLeft = 26;
    const width = 400;
    const height = Math.ceil((data.length + 0.1) * barHeight) + marginTop + marginBottom;

    // Create the scales.
    const x = d3.scaleLinear()
        .domain([0, 100])
        .range([marginLeft, width - marginRight]);

    const y = d3.scaleBand()
        .domain(data.map((d: { id: any; }) => d.id))
        .rangeRound([marginTop, height - marginBottom])
        .padding(0.1);

    let svgRef: SVGSVGElement | undefined;

    onMount(() => {
        if (svgRef) {

            const svg = d3.select(svgRef);

            // Create the axes.
            svg.append("g")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .call(d3.axisBottom(x).ticks(10).tickFormat((d) => (d + "%")))
                .call(g => g.select(".domain").remove());

            svg.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(d3.axisLeft(y).tickSizeOuter(0))
                .call(g => g.select(".domain").remove());
        }
    });

    return (

        <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox={`0 0 ${width} ${height}`}>

            {/* Add a rect for each bar. */}
            <For each={data}>{
                (d) => (<>

                    <rect
                        fill="steelblue"
                        x={x(0)}
                        y={y(d.id)}
                        width={x(d.value) - x(0)}
                        height={y.bandwidth()}
                    />
                    <g
                        fill="white"
                        text-anchor="end">
                        <text
                            x={x(d.value)}
                            y={y(d.id) as number + y.bandwidth() / 2}
                            dy="0.35em"
                            dx="-4"
                            font-size="0.8em">
                            {d.value.toFixed(1) + " %"}
                        </text>

                    </g>


                </>)
            }
            </For >

        </svg >

    );
}