// @ts-nocheck
import { onMount, Show } from "solid-js";
import * as d3 from "d3";
import useAppStore from "./AppStore";

export default function InputChart() {

    const [appStore, setAppStore] = useAppStore;

    let data = [
        { letter: "Aaa", frequency: 40.3 },
        { letter: "Bbb", frequency: 50.6 },
        { letter: "Ccc", frequency: 45.4 },
    ]

    const width = 200;
    const height = 200;
    const marginTop = 30;
    const marginRight = 0;
    const marginBottom = 30;
    const marginLeft = 40;

    // Declare the x (horizontal position) scale.
    const x = d3.scaleBand()
        .domain(["Aaa", "Bbb", "Ccc"]) // descending frequency
        .range([marginLeft, width - marginRight])
        .padding(0.1);

    // Declare the y (vertical position) scale.
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, (d) => d.frequency)])
        .range([height - marginBottom, marginTop]);

    let svgRef: SVGSVGElement | undefined;

    onMount(() => {
        if (svgRef) {

            const svg = d3.select(svgRef);

            // Add a rect for each bar.
            svg.append("g")
                .attr("fill", "steelblue")
                .selectAll()
                .data(data)
                .join("rect")
                .attr("x", (d) => x(d.letter))
                .attr("y", (d) => y(d.frequency))
                .attr("height", (d) => y(0) - y(d.frequency))
                .attr("width", x.bandwidth());

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
                    .attr("y", 10)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "start")
                    .text("Drying (%)"));

        }
    });

    return (

        <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox={`0 0 ${width} ${height}`}>
        </svg>

    );
}