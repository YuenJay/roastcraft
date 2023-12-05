// @ts-nocheck
import { onMount, Show } from "solid-js";
import * as d3 from "d3";
import useAppStore from "./AppStore";

export default function BarChart(props: any) {

    const [appStore, setAppStore] = useAppStore;

    const width = 200;
    const height = 200;
    const marginTop = 20;
    const marginRight = 10;
    const marginBottom = 30;
    const marginLeft = 20;

    // Declare the x (horizontal position) scale.
    const x = d3.scaleBand()
        .domain(props.data.map(d => d.id)) // descending frequency
        .range([marginLeft, width - marginRight])
        .padding(0.1);

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
                .call(d3.axisLeft(y).tickFormat(y => y.toFixed()))
                .call(g => g.select(".domain").remove())
                .call(g => g.append("text")
                    .attr("x", -marginLeft)
                    .attr("y", marginTop - 10)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "start")
                    .text(`${props.title} (%)`));

        }
    });

    return (

        <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox={`0 0 ${width} ${height}`}>
            <g fill="steelblue">
                {/* Add a rect for each bar. */}
                <rect
                    x={x(props.data[0].id)}
                    y={y(props.data[0].percent)}
                    height={y(0) - y(props.data[0].percent)}
                    width={x.bandwidth()}
                />


            </g>
        </svg>

    );
}