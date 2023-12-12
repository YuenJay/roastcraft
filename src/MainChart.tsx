// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, createEffect, Show, For, } from "solid-js";
import * as d3 from "d3";
import { GET, EventId, appStateSig, BT } from "./AppState";
import Annotation from "./Annotation";

export default function MainChart() {

    const [appState, setAppState] = appStateSig;
    const [timeDelta, setTimeDelta] = appState().timeDeltaSig;
    const [metrics, setMetrics] = appState().metricsSig;
    const [cursorLineX, setCursorLineX] = appState().cursorLineXSig;

    const bt = metrics()[appState().btIndex];

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
        .x((p: any) => xScale(p.timestamp + timeDelta()))
        .y((p: any) => yScale(p.value));

    const lineROR = d3.line()
        .x((p: any) => xScale(p.timestamp + timeDelta()))
        .y((p: any) => yScaleROR(p.value));

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

        svg.on("mousemove", (event) => {
            setCursorLineX(d3.pointer(event)[0]);
            // console.log(xScale.invert(d3.pointer(event)[0]));
        });
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

            {/* ROR linear regression */}
            <line stroke="#00DD00"
                stroke-width="2"
                clip-path="url(#clip-path)"
                x1={xScale(appState().rorLinearStartSig[GET]().timestamp + timeDelta())}
                y1={yScaleROR(appState().rorLinearStartSig[GET]().value)}
                x2={xScale(appState().rorLinearEndSig[GET]().timestamp + timeDelta())}
                y2={yScaleROR(appState().rorLinearEndSig[GET]().value)}
            ></line>
            <foreignObject clip-path="url(#clip-path)" width="100%" height="100%" pointer-events="none"
                x={xScale(appState().rorLinearEndSig[GET]().timestamp + timeDelta()) - 40}
                y={yScaleROR(appState().rorLinearEndSig[GET]().value) + 5}
            >
                <div class="absolute shadow-[1px_1px_0px_0px] shadow-gray-500 bg-gray-100 border rounded-sm text-xs px-0.5"
                    style={`color: #00BB00;`}>
                    {(appState().rorLinearSlopeSig[GET]() * 60).toFixed(2)}
                </div>
            </foreignObject>


            <For each={metrics().filter(m => m.id != BT)}>
                {
                    (m) => (
                        <>
                            {/* temperature */}
                            <path
                                fill="none"
                                stroke={m.color}
                                stroke-width="1.5"
                                d={line(m.data() as any) as string | undefined}
                                clip-path="url(#clip-path)"
                            />
                            <g
                                fill={m.color}
                                stroke={m.color}
                                stroke-width="1"
                                clip-path="url(#clip-path)" >
                                <Show when={m.data().length > 0}>
                                    <circle
                                        cx={xScale(m.data()[m.data().length - 1].timestamp + timeDelta())}
                                        cy={yScale(m.data()[m.data().length - 1].value)}
                                        r="2" />

                                    <foreignObject width="100%" height="100%" pointer-events="none"
                                        x={xScale(m.data()[m.data().length - 1].timestamp + timeDelta()) + 5}
                                        y={yScale(m.data()[m.data().length - 1].value) - 10}
                                    >
                                        <div class="absolute shadow-[1px_1px_0px_0px] shadow-gray-500 bg-gray-100 border rounded-sm text-xs px-0.5"
                                            style={`color: ${m.color};`}>
                                            {m.data()[m.data().length - 1].value.toFixed(1)}
                                        </div>
                                    </foreignObject>
                                </Show>
                            </g>
                        </>
                    )
                }
            </For>

            {/* BT */}
            <path
                fill="none"
                stroke={bt.color}
                stroke-width="1.5"
                d={line(bt.data() as any) as string | undefined}
                clip-path="url(#clip-path)"
            />
            <g
                fill={bt.color}
                stroke={bt.color}
                stroke-width="1"
                clip-path="url(#clip-path)" >
                <Show when={bt.data().length > 0}>
                    <circle
                        cx={xScale(bt.data()[bt.data().length - 1].timestamp + timeDelta())}
                        cy={yScale(bt.data()[bt.data().length - 1].value)}
                        r="2" />

                    <foreignObject width="100%" height="100%" pointer-events="none"
                        x={xScale(bt.data()[bt.data().length - 1].timestamp + timeDelta()) + 5}
                        y={yScale(bt.data()[bt.data().length - 1].value) - 8}
                    >
                        <div class="absolute shadow-[1px_1px_0px_0px] shadow-gray-500 bg-gray-100 border rounded-sm text-xs px-0.5"
                            style={`color: ${bt.color};`}>
                            {bt.data()[bt.data().length - 1].value.toFixed(1)}
                        </div>
                    </foreignObject>
                </Show>
            </g>

            {/* rate of rise */}
            <path
                fill="none"
                stroke={bt.color}
                stroke-width="1.5"
                d={lineROR(bt.rorFilteredSig[GET]().filter((p) => (p.timestamp + timeDelta() > 0)) as any) as string | undefined}
                clip-path="url(#clip-path)"
            />
            <g
                fill={bt.color}
                stroke={bt.color}
                stroke-width="1"
                clip-path="url(#clip-path)">
                <Show when={bt.rorFilteredSig[GET]().length > 0}>
                    <circle
                        cx={xScale(bt.rorFilteredSig[GET]()[bt.rorFilteredSig[GET]().length - 1].timestamp + timeDelta())}
                        cy={yScaleROR(bt.rorFilteredSig[GET]()[bt.rorFilteredSig[GET]().length - 1].value)}
                        r="2" />

                    <foreignObject width="100%" height="100%" pointer-events="none"
                        x={xScale(bt.rorFilteredSig[GET]()[bt.rorFilteredSig[GET]().length - 1].timestamp + timeDelta()) + 5}
                        y={yScaleROR(bt.rorFilteredSig[GET]()[bt.rorFilteredSig[GET]().length - 1].value) - 8}
                    >
                        <div class="absolute shadow-[1px_1px_0px_0px] shadow-gray-500 bg-gray-100 border rounded-sm text-xs px-0.5"
                            style={`color: ${bt.color};`}>
                            {bt.rorFilteredSig[GET]()[bt.rorFilteredSig[GET]().length - 1].value.toFixed(1)}
                        </div>
                    </foreignObject>
                </Show>
            </g>
            {/* BT ROR outlier */}
            <For each={bt.rorOutlierSig[GET]().filter((p) => (p.timestamp + timeDelta() > 0))}>
                {
                    (outlier) => (
                        <>
                            <g
                                fill="none"
                                stroke={bt.color}
                                stroke-width="1"
                                stroke-opacity="50%"
                                clip-path="url(#clip-path)">
                                <circle
                                    cx={xScale(outlier.timestamp + timeDelta())}
                                    cy={yScaleROR(outlier.value)}
                                    r="2" />
                            </g>
                        </>
                    )}
            </For>

            <For each={appState().eventsSig[GET]()}>
                {
                    (item) => (
                        <g clip-path="url(#clip-path)">
                            <circle
                                fill="none"
                                stroke="#000000"
                                stroke-width="1"
                                cx={xScale(item.timestamp + timeDelta())}
                                cy={item.id == EventId.ROR_TP ? yScaleROR(item.value) : yScale(item.value)}
                                r="2" />
                            <Annotation
                                x={xScale(item.timestamp + timeDelta())}
                                y={item.id == EventId.ROR_TP ? yScaleROR(item.value) : yScale(item.value)}
                                text={item.id}
                                timestamp={item.timestamp + timeDelta()}
                                value={item.value.toFixed(1)}
                            />
                        </g>
                    )}
            </For>
            <line stroke="#00FF00"
                stroke-width="1"
                clip-path="url(#clip-path)"
                x1={cursorLineX()}
                y1={marginTop}
                x2={cursorLineX()}
                y2={height - marginBottom}
            ></line>

        </svg >
    );
}