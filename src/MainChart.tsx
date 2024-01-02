// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, Show, For, createSignal, createEffect, } from "solid-js";
import * as d3 from "d3";
import { GET, RoastEventId, appStateSig, BT, AppStatus } from "./AppState";
import Annotation from "./Annotation";
import ToolTip from "./ToolTip";

export function timestamp_format(timestamp: number) {
    return Math.floor(timestamp / 60).toString() + ":" + (timestamp % 60).toString().padStart(2, '0');
}

export default function MainChart() {

    const [appState, _setAppState] = appStateSig;
    const [status, _setStatus] = appState().statusSig;
    const [timer, _setTimer] = appState().timerSig;
    const [timeDelta, _setTimeDelta] = appState().timeDeltaSig;
    const [channelArr, _setChannelArr] = appState().channelArrSig;
    const [cursorLineX, setCursorLineX] = appState().cursorLineXSig;
    const [cursorTimestamp, setCursorTimestamp] = appState().cursorTimestampSig;
    const [roastEvents, _setRoastEvents] = appState().roastEventsSig;
    const bt = channelArr()[appState().btIndex];

    const [cursorIndex, setCursorIndex] = createSignal(0);

    const width = 800;
    const height = 400;
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

    let index = 0;

    onMount(() => {
        const svg = d3.select(svgRef);

        svg.append("g")
            .attr("transform", `translate(0, ${height - marginBottom} )`)
            .call(d3.axisBottom(xScale)
                .tickValues(d3.range(0, 720, 60))
                .tickFormat((d) => timestamp_format(d as number)));

        svg.append("g")
            .attr("transform", `translate(${marginLeft}, 0)`)
            .call(d3.axisLeft(yScale));

        svg.append("g")
            .attr("transform", `translate(${width - marginRight}, 0)`)
            .call(d3.axisRight(yScaleROR));

        svg.on("mousemove", (event) => {
            setCursorLineX(d3.pointer(event)[0]);
            setCursorTimestamp(xScale.invert(d3.pointer(event)[0]));
        });
    });

    createEffect(() => {
        setCursorIndex(
            d3.bisectCenter(
                bt.dataArr().map((p) => p.timestamp + timeDelta()),
                cursorTimestamp()
            )
        );
    });

    return (

        <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox={`0 0 ${width} ${height}`} >

            <defs>
                {/* Defines clipping area, rect is inside axis*/}
                <clipPath
                    clipPathUnits="userSpaceOnUse"
                    id="clip-path">
                    <rect x={marginLeft} y={marginTop} width={width - marginLeft - marginRight} height={height - marginTop - marginBottom} />
                </clipPath>
            </defs>

            {/* ROR linear regression */}
            <Show when={appState().roastEventsSig[GET]().ROR_TP != undefined && appState().toggleShowRorRegressionSig[GET]()}>
                <line stroke="#00DD00"
                    stroke-width="2"
                    clip-path="url(#clip-path)"
                    x1={xScale(appState().rorLinearStartSig[GET]().timestamp + timeDelta())}
                    y1={yScaleROR(appState().rorLinearStartSig[GET]().value)}
                    x2={xScale(appState().rorLinearEndSig[GET]().timestamp + timeDelta())}
                    y2={yScaleROR(appState().rorLinearEndSig[GET]().value)}
                ></line>
                <ToolTip
                    x={xScale(appState().rorLinearEndSig[GET]().timestamp + timeDelta())}
                    y={yScaleROR(appState().rorLinearEndSig[GET]().value)}
                    text={"m : " + (appState().rorLinearSlopeSig[GET]() * 60).toFixed(2)}
                    color="#00BB00"
                />
            </Show>

            <For each={channelArr().filter(c => c.id != BT)}>
                {(c) => (
                    <g
                        clip-path="url(#clip-path)" >
                        <path
                            fill="none"
                            stroke={c.color}
                            stroke-width="1.5"
                            d={line(c.dataArr() as any) as string | undefined}

                        />
                    </g>
                )}
            </For>

            {/* BT */}
            <g
                clip-path="url(#clip-path)" >
                <path
                    fill="none"
                    stroke={bt.color}
                    stroke-width="1.5"
                    d={line(bt.dataArr() as any) as string | undefined}
                />
            </g>

            {/* rate of rise filtered*/}
            <g
                clip-path="url(#clip-path)">
                <Show when={appState().toggleShowRorFilteredSig[GET]()}>
                    <path
                        fill="none"
                        stroke={bt.color}
                        stroke-opacity="30%"
                        stroke-width="1.5"
                        d={lineROR(bt.rorFilteredArrSig[GET]().filter((p) => (p.timestamp + timeDelta() > 0)) as any) as string | undefined}
                    />
                </Show>
            </g>

            {/* rate of rise convolve */}
            <path
                fill="none"
                stroke="#00DD00"
                stroke-width="1.5"
                d={lineROR(bt.rorConvolveArrSig[GET]().filter((p) => (p.timestamp + timeDelta() > 0)) as any) as string | undefined}
                clip-path="url(#clip-path)"
            />

            {/* BT ROR outlier */}
            <Show when={appState().toggleShowRorOutlierSig[GET]()}>
                <g
                    fill="none"
                    stroke={bt.color}
                    stroke-width="1"
                    stroke-opacity="50%"
                    clip-path="url(#clip-path)">
                    <For each={bt.rorOutlierArrSig[GET]().filter((p) => (p.timestamp + timeDelta() > 0))}>
                        {(outlier) => (
                            <circle
                                cx={xScale(outlier.timestamp + timeDelta())}
                                cy={yScaleROR(outlier.value)}
                                r="2" />
                        )}
                    </For>
                </g>
            </Show>
            <For each={Object.values(roastEvents()).filter((e) => e != undefined)}>
                {(item) => (
                    <Annotation
                        x={xScale(item.timestamp + timeDelta())}
                        y={item.id == RoastEventId.ROR_TP ? yScaleROR(item.value) : yScale(item.value)}
                        text={item.id}
                        timestamp={item.timestamp + timeDelta()}
                        value={item.value.toFixed(1)}
                    />
                )}
            </For>

            {/* realtime tooltip */}
            <Show when={status() == AppStatus.RECORDING}>
                <For each={channelArr().filter(c => c.id != BT)}>
                    {(c) => (
                        <g clip-path="url(#clip-path)" >
                            <ToolTip
                                x={xScale(timer() + timeDelta())}
                                y={yScale(c.currentDataSig[GET]())}
                                text={c.currentDataSig[GET]().toFixed(1)}
                                color={c.color}
                            />
                        </g>
                    )}
                </For>

                <g clip-path="url(#clip-path)" >
                    <ToolTip
                        x={xScale(timer() + timeDelta())}
                        y={yScaleROR(bt.currentRorSig[GET]())}
                        text={bt.currentRorSig[GET]().toFixed(1)}
                        color={bt.color}
                    />
                    <ToolTip
                        x={xScale(timer() + timeDelta())}
                        y={yScale(bt.currentDataSig[GET]())}
                        text={bt.currentDataSig[GET]().toFixed(1)}
                        color={bt.color}
                    />
                </g>
            </Show>

            <line stroke="#00FF00"
                stroke-width="1"
                clip-path="url(#clip-path)"
                x1={cursorLineX()}
                y1={marginTop}
                x2={cursorLineX()}
                y2={height - marginBottom}
            ></line>
            <For each={channelArr().filter(c => c.id != BT)}>
                {(c) => (
                    <Show when={c.dataArr()[cursorIndex()] != undefined && timeDelta() < cursorTimestamp() && cursorTimestamp() < timer() + timeDelta()}>
                        <ToolTip
                            x={xScale(c.dataArr()[cursorIndex()].timestamp + timeDelta())}
                            y={yScale(c.dataArr()[cursorIndex()].value)}
                            text={c.dataArr()[cursorIndex()].value}
                            color={c.color}
                        />
                    </Show>
                )}
            </For>
            <Show when={bt.dataArr()[cursorIndex()] != undefined && timeDelta() < cursorTimestamp() && cursorTimestamp() < timer() + timeDelta()}>
                <ToolTip
                    x={xScale(bt.dataArr()[cursorIndex()].timestamp + timeDelta())}
                    y={yScale(bt.dataArr()[cursorIndex()].value)}
                    text={bt.dataArr()[cursorIndex()].value}
                    color={bt.color}
                />
            </Show>
        </svg >
    );
}