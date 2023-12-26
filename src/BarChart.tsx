// SPDX-License-Identifier: GPL-3.0-or-later

import { For, onMount } from "solid-js";
import * as d3 from "d3";
import { timestamp_format } from "./calculate";

export default function BarChart(props: any) {

    const width = 200;
    const height = 200;
    const marginTop = 20;
    const marginRight = 10;
    const marginBottom = 30;
    const marginLeft = 20;

    // Declare the x (horizontal position) scale.
    const x = d3.scaleBand()
        .domain(props.data.map((d: { id: any; }) => d.id))
        .range([marginLeft, width - marginRight])
        .padding(0.2);

    // Declare the y (vertical position) scale.
    const y = d3.scaleLinear()
        .domain([0, 60])
        .range([height - marginBottom, marginTop]);

    let svgRef: SVGSVGElement | undefined;

    onMount(() => {
        if (svgRef) {

            const svg = d3.select(svgRef);

            // Add the x-axis and label.
            svg.append("g")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .call(d3.axisBottom(x).tickSizeOuter(0));

            // Add the y-axis and label, and remove the domain line.
            svg.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(d3.axisLeft(y).tickFormat((y: any) => y.toFixed()))
                .call(g => g.select(".domain").remove())
            // .call(g => g.append("text")
            //     .attr("x", -marginLeft)
            //     .attr("y", marginTop - 10)
            //     .attr("fill", "currentColor")
            //     .attr("text-anchor", "start")
            //     .text(`${props.title}`));

        }
    });

    return (

        <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox={`0 0 ${width} ${height}`}>

            {/* Add a rect for each bar. */}
            <For each={props.data}>{
                (d) => (<>
                    <rect
                        fill="steelblue"
                        opacity={d.opacity}
                        x={x(d.id)}
                        y={y(d.phase().percent)}
                        height={y(0) - y(d.phase().percent)}
                        width={x.bandwidth() / 2}
                    />
                    <text x={x(d.id) as number + x.bandwidth() / 4}
                        y={y(d.phase().percent) - 3}
                        text-anchor="middle"
                    >
                        {d.phase().percent.toFixed(1) + ' %'}
                    </text>
                    {/* <text x={x(d.id) as number + x.bandwidth() / 4}
                        y={y(d.phase().percent) - 15}
                        text-anchor="middle"
                    >
                        {timestamp_format(d.phase().time)}
                    </text> */}
                    <rect
                        fill="orange"
                        opacity={d.opacity}
                        x={x(d.id) as number + x.bandwidth() / 2}
                        y={y(d.phase().temp_rise)}
                        height={y(0) - y(d.phase().temp_rise)}
                        width={x.bandwidth() / 2}
                    />
                    <text x={x(d.id) as number + x.bandwidth() * 3 / 4}
                        y={y(d.phase().temp_rise) - 3}
                        text-anchor="middle"
                    >
                        {d.phase().temp_rise.toFixed(1) + '°'}
                    </text>
                </>)
            }
            </For >

        </svg >

    );
}