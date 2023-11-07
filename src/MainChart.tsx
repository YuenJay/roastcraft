import { onMount, Show, createEffect } from "solid-js";
import * as d3 from "d3";
import useAppStore from "./AppStore";

export default function MainChart() {

    const [appStore, setAppStore] = useAppStore;

    let data = appStore.metrics[0].data;

    const width = 800;
    const height = 500;
    const marginTop = 10;
    const marginRight = 10;
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

    // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#definite-assignment-assertions
    let svgRef!: SVGSVGElement;
    let axisBottomRef!: SVGSVGElement;
    let axisLeftRef!: SVGSVGElement;

    onMount(() => {
        const svg = d3.select(svgRef);

        d3.select(axisBottomRef)
            .call(d3.axisBottom(xScale));

        d3.select(axisLeftRef)
            .call(d3.axisLeft(yScale));
    });

    createEffect(() => {
        // use d3.select(ref) to replace d3.append
        // use attributes in jsx directly, to replace d3.attr
    });

    return (

        <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox={`0 0 ${width} ${height}`} >
            <g ref={axisBottomRef} transform={`translate(0, ${height - marginBottom} )`}></g>
            <g ref={axisLeftRef} transform={`translate(${marginLeft}, 0)`}></g>

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


        </svg >

    );
}