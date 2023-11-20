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
        [-60, 660],
        [marginLeft, width - marginRight]
    );

    const yScale = d3.scaleLinear([0, 400], [
        height - marginBottom,
        marginTop,
    ]);

    const yScaleROR = d3.scaleLinear([0, 50], [
        height - marginBottom,
        marginTop,
    ]);

    const line = d3.line()
        .x((d: any) => xScale(d.timestamp))
        .y((d: any) => yScale(d.value));

    const lineROR = d3.line()
        .x((d: any) => xScale(d.timestamp))
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
                            />
                            <g
                                fill={appStore.metrics[item].color}
                                stroke={appStore.metrics[item].color}
                                stroke-width="1">
                                <Show when={appStore.timer > 0}>
                                    <circle
                                        cx={xScale(appStore.timer)}
                                        cy={yScale(appStore.metrics[item].current_reading)}
                                        r="2" />
                                    <text
                                        x={xScale(appStore.timer) + 4}
                                        y={yScale(appStore.metrics[item].current_reading)}>
                                        {appStore.metrics[item].current_reading}
                                    </text>
                                </Show>
                            </g>
                            {/* rate of rise */}
                            <Show when={appStore.metrics[item].ror_enabled}>
                                <path
                                    fill="none"
                                    stroke={appStore.metrics[item].color}
                                    stroke-width="1.5"
                                    d={lineROR(appStore.metrics[item].ror_data) as string | undefined}
                                />
                                <g
                                    fill={appStore.metrics[item].color}
                                    stroke={appStore.metrics[item].color}
                                    stroke-width="1">
                                    <Show when={appStore.timer > 0}>
                                        <circle
                                            cx={xScale(appStore.timer)}
                                            cy={yScaleROR(appStore.metrics[item].rate_of_rise)}
                                            r="2" />
                                        <text
                                            x={xScale(appStore.timer) + 4}
                                            y={yScaleROR(appStore.metrics[item].rate_of_rise)}>
                                            {appStore.metrics[item].rate_of_rise}
                                        </text>
                                    </Show>
                                </g>
                            </Show>
                        </>
                    )
                }
            </For>
        </svg >
    );
}