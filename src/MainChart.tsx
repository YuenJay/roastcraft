// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, createEffect, Show, For } from "solid-js";
import * as d3 from "d3";
import useAppStore from "./AppStore";

export default function MainChart() {

    const [appStore, setAppStore] = useAppStore;

    const width = 800;
    const height = 500;
    const marginTop = 10;
    const marginRight = 30;
    const marginBottom = 20;
    const marginLeft = 30;

    const xScale = d3.scaleLinear(
        [-60, 720],
        [marginLeft, width - marginRight]
    );

    const yScale = d3.scaleLinear([0, 400], [
        height - marginBottom,
        marginTop,
    ]);

    const yScaleROR = d3.scaleLinear([0, 35], [
        height - marginBottom,
        marginTop,
    ]);

    const line = d3.line()
        .x((d: any) => xScale(d.timestamp + appStore.time_delta))
        .y((d: any) => yScale(d.value));

    const lineROR = d3.line()
        .x((d: any) => xScale(d.timestamp + appStore.time_delta))
        .y((d: any) => yScaleROR(d.value));

    // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#definite-assignment-assertions
    let svgRef!: SVGSVGElement;
    let axisBottomRef!: SVGSVGElement;
    let axisLeftRef!: SVGSVGElement;
    let axisRightRef!: SVGSVGElement;

    onMount(() => {
        const svg = d3.select(svgRef);

        d3.select(axisBottomRef)
            .call(d3.axisBottom(xScale));

        d3.select(axisLeftRef)
            .call(d3.axisLeft(yScale));

        d3.select(axisRightRef)
            .call(d3.axisRight(yScaleROR));
    });

    createEffect(() => {
        // use d3.select(ref) to replace d3.append
        // use attributes in jsx directly, to replace d3.attr
    });

    return (

        <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox={`0 0 ${width} ${height}`} >
            <g ref={axisBottomRef} transform={`translate(0, ${height - marginBottom} )`}></g>
            <g ref={axisLeftRef} transform={`translate(${marginLeft}, 0)`}></g>
            <g ref={axisRightRef} transform={`translate(${width - marginRight}, 0)`}></g>

            <defs>
                {/* Defines clipping area, rect is inside axis*/}
                <clipPath
                    clipPathUnits="userSpaceOnUse"
                    id="clip-path">
                    <rect x={marginLeft} y={marginTop} width={width - marginLeft - marginRight} height={height - marginTop - marginBottom} />
                </clipPath>
            </defs>

            {/* a reversed key array such as : [2,1,0] 
              draw BT (at index 0) at last so that it is on the top */}
            <For each={[...appStore.metrics_id_list.keys()].reverse()}>
                {
                    (item) => (
                        <>
                            {/* temperature */}
                            <path
                                fill="none"
                                stroke={appStore.metrics[item].color}
                                stroke-width="1.5"
                                d={line(appStore.metrics[item].data) as string | undefined}
                                clip-path="url(#clip-path)"
                            />
                            <g
                                fill={appStore.metrics[item].color}
                                stroke={appStore.metrics[item].color}
                                stroke-width="1"
                                clip-path="url(#clip-path)" >
                                <Show when={appStore.metrics[item].data.length > 0}>
                                    <circle
                                        cx={xScale(appStore.metrics[item].data[appStore.metrics[item].data.length - 1].timestamp + appStore.time_delta)}
                                        cy={yScale(appStore.metrics[item].data[appStore.metrics[item].data.length - 1].value)}
                                        r="2" />
                                    <text
                                        x={xScale(appStore.metrics[item].data[appStore.metrics[item].data.length - 1].timestamp) + appStore.time_delta + 4}
                                        y={yScale(appStore.metrics[item].data[appStore.metrics[item].data.length - 1].value)}>
                                        {appStore.metrics[item].data[appStore.metrics[item].data.length - 1].value.toFixed(1)}
                                    </text>
                                </Show>
                            </g>
                            {/* rate of rise */}
                            <Show when={appStore.metrics[item].ror_enabled}>
                                <path
                                    fill="none"
                                    stroke={appStore.metrics[item].color}
                                    stroke-width="1.5"
                                    d={lineROR(appStore.metrics[item].ror) as string | undefined}
                                    clip-path="url(#clip-path)"
                                />
                                <g
                                    fill={appStore.metrics[item].color}
                                    stroke={appStore.metrics[item].color}
                                    stroke-width="1"
                                    clip-path="url(#clip-path)">
                                    <Show when={appStore.metrics[item].ror.length > 0}>
                                        <circle
                                            cx={xScale(appStore.metrics[item].ror[appStore.metrics[item].ror.length - 1].timestamp + appStore.time_delta)}
                                            cy={yScaleROR(appStore.metrics[item].ror[appStore.metrics[item].ror.length - 1].value)}
                                            r="2" />
                                        <text
                                            x={xScale(appStore.metrics[item].ror[appStore.metrics[item].ror.length - 1].timestamp) + appStore.time_delta + 4}
                                            y={yScaleROR(appStore.metrics[item].ror[appStore.metrics[item].ror.length - 1].value)}>
                                            {appStore.metrics[item].ror[appStore.metrics[item].ror.length - 1].value.toFixed(1)}
                                        </text>
                                    </Show>
                                </g>
                                {/* BT ROR outlier */}
                                <For each={appStore.metrics[item].ror.filter((ror: any) => (ror.outlier == true))}>
                                    {
                                        (outlier) => (
                                            <>
                                                <g
                                                    fill="none"
                                                    stroke={appStore.metrics[item].color}
                                                    stroke-width="1"
                                                    clip-path="url(#clip-path)">
                                                    <circle
                                                        cx={xScale(outlier.timestamp + appStore.time_delta)}
                                                        cy={yScaleROR(outlier.value)}
                                                        r="4" />
                                                </g>
                                            </>
                                        )}
                                </For>
                            </Show>


                        </>
                    )
                }
            </For>

            <For each={appStore.events}>
                {
                    (item) => (
                        <>
                            <g
                                fill="none"
                                stroke="#9c27b0"
                                stroke-width="1"
                                clip-path="url(#clip-path)">
                                <circle
                                    cx={xScale(item.timestamp + appStore.time_delta)}
                                    cy={yScale(item.value)}
                                    r="4" />
                                <text
                                    fill="#570885"
                                    x={xScale(item.timestamp) + appStore.time_delta + 4}
                                    y={yScale(item.value)}>
                                    {item.id + " : " + item.value + " @ " + item.timestamp}
                                </text>
                            </g>
                        </>
                    )}
            </For>
            <For each={appStore.ror_events}>
                {
                    (item) => (
                        <>
                            <g
                                fill="none"
                                stroke="#9c27b0"
                                stroke-width="1"
                                clip-path="url(#clip-path)">
                                <circle
                                    cx={xScale(item.timestamp + appStore.time_delta)}
                                    cy={yScaleROR(item.value)}
                                    r="4" />
                                <text
                                    fill="#570885"
                                    x={xScale(item.timestamp) + appStore.time_delta + 4}
                                    y={yScaleROR(item.value)}>
                                    {item.id + " : " + item.value + " @ " + item.timestamp}
                                </text>
                            </g>
                        </>
                    )}
            </For>
            <line stroke="#00FF00"
                stroke-width="3"
                clip-path="url(#clip-path)"
                x1={xScale(appStore.ROR_linear_start.timestamp + appStore.time_delta)}
                y1={yScaleROR(appStore.ROR_linear_start.value)}
                x2={xScale(appStore.ROR_linear_end.timestamp + appStore.time_delta)}
                y2={yScaleROR(appStore.ROR_linear_end.value)}
            ></line>
            <line stroke="#FF0000"
                stroke-width="3"
                clip-path="url(#clip-path)"
                x1={xScale(appStore.ROR_linear_start2.timestamp + appStore.time_delta)}
                y1={yScaleROR(appStore.ROR_linear_start2.value)}
                x2={xScale(appStore.ROR_linear_end2.timestamp + appStore.time_delta)}
                y2={yScaleROR(appStore.ROR_linear_end2.value)}
            ></line>
        </svg >
    );
}