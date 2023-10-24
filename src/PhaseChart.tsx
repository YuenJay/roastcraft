// @ts-nocheck
import { onMount, Show } from "solid-js";
import * as d3 from "d3";
import useAppStore from "./AppStore";

export default function InputChart() {

    const [appStore, setAppStore] = useAppStore;

    let data = [
        { state: "AL", age: "<10", population: 598478 },
        { state: "AL", age: "10-19", population: 638789 },
        { state: "AL", age: "20-29", population: 661666 },
        { state: "AL", age: "30-39", population: 603013 },
        { state: "AL", age: "40-49", population: 625599 },
        { state: "AK", age: "<10", population: 598478 },
        { state: "AK", age: "10-19", population: 638789 },
        { state: "AK", age: "20-29", population: 661666 },
        { state: "AK", age: "30-39", population: 603013 },
        { state: "AK", age: "40-49", population: 625599 }
    ]

    const width = 800;

    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 20;
    const marginLeft = 30;

    // Determine the series that need to be stacked.
    const series = d3.stack()
        .keys(d3.union(data.map(d => d.age))) // distinct series keys, in input order
        .value(([, D], key) => D.get(key).population) // get value for each series key and stack
        .offset(d3.stackOffsetExpand)
        (d3.index(data, d => d.state, d => d.age)); // group by stack then series key

    // Compute the height from the number of stacks.
    const height = series[0].length * 25 + marginTop + marginBottom;

    // Prepare the scales for positional and color encodings.
    const x = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
        .range([marginLeft, width - marginRight]);

    const y = d3.scaleBand()
        .domain(d3.groupSort(data, (D) => -D.find(d => d.age === "<10").population / d3.sum(D, d => d.population), d => d.state))
        .range([marginTop, height - marginBottom])
        .padding(0.08);

    const color = d3.scaleOrdinal()
        .domain(series.map(d => d.key))
        .range(d3.schemeSpectral[series.length])
        .unknown("#ccc");

    // A function to format the value in the tooltip.
    const formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString("en")

    let svgRef: SVGSVGElement | undefined;

    onMount(() => {
        if (svgRef) {

            const svg = d3.select(svgRef)
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", [0, 0, width, height])
                .attr("style", "max-width: 100%; height: auto;");
            // Append a group for each series, and a rect for each element in the series.
            svg.append("g")
                .selectAll()
                .data(series)
                .join("g")
                .attr("fill", d => color(d.key))
                .selectAll("rect")
                .data(D => D.map(d => (d.key = D.key, d)))
                .join("rect")
                .attr("x", d => x(d[0]))
                .attr("y", d => y(d.data[0]))
                .attr("height", y.bandwidth())
                .attr("width", d => x(d[1]) - x(d[0]))
                .append("title")
                .text(d => `${d.data[0]} ${d.key}\n${formatValue(d.data[1].get(d.key).population)}`);
            // Append the horizontal axis.
            svg.append("g")
                .attr("transform", `translate(0,${marginTop})`)
                .call(d3.axisTop(x).ticks(width / 100, "%"))
                .call(g => g.selectAll(".domain").remove());

            // Append the vertical axis.
            svg.append("g")
                .attr("transform", `translate(${marginLeft},0)`)
                .call(d3.axisLeft(y).tickSizeOuter(0))
                .call(g => g.selectAll(".domain").remove());
        }
    });

    return (

        <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox="0 0 800 50" >
        </svg>

    );
}