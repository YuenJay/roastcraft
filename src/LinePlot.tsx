import { onMount, Show } from "solid-js";
import * as d3 from "d3";

export default function LinePlot({ data }: { data: any[] }) {

    const width = 800;
    const height = 400;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 20;
    const marginLeft = 30;

    const xScale = d3.scaleLinear(
        [0, 600],
        [marginLeft, width - marginRight]
    );
    const yScale = d3.scaleLinear([0, 300], [
        height - marginBottom,
        marginTop,
    ]);

    const line = d3.line()
        .x((d: any) => xScale(d.timestamp))
        .y((d: any) => yScale(d.value));

    let svgRef: SVGSVGElement | undefined;

    onMount(() => {
        if (svgRef) {
            d3.select(svgRef).append("g")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .call(d3.axisBottom(xScale));

            d3.select(svgRef).append("g")
                .attr("transform", `translate(${marginLeft}, 0)`)
                .call(d3.axisLeft(yScale));
        }
    });

    return (
        <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox="0 0 800 400">
            <path
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                d={line(data) as string | undefined}
            />
            <g fill="white" stroke="currentColor" stroke-width="1">

                <Show when={data.length > 0}>
                    <circle cx={xScale(data[data.length - 1].timestamp)} cy={yScale(data[data.length - 1].value)} r="2" />
                </Show>
            </g>
        </svg>
    );
}