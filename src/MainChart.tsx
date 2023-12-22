// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, Show, For, } from "solid-js";
import * as d3 from "d3";
import { GET, RoastEventId, appStateSig, BT } from "./AppState";
import Annotation from "./Annotation";
import ToolTip, { ToolTipDirection } from "./ToolTip";


export default function MainChart() {

    const [appState, _setAppState] = appStateSig;
    const [timeDelta, _setTimeDelta] = appState().timeDeltaSig;
    const [channelArr, _setChannelArr] = appState().channelArrSig;
    const [cursorLineX, setCursorLineX] = appState().cursorLineXSig;
    const [roastEvents, _setRoastEvents] = appState().roastEventsSig;
    const bt = channelArr()[appState().btIndex];

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
            <Show when={appState().roastEventsSig[GET]().ROR_TP != undefined && appState().toggleShowRorRegressionSig[GET]()}>
                <line stroke="#00DD00"
                    stroke-width="2"
                    clip-path="url(#clip-path)"
                    x1={xScale(appState().rorLinearStartSig[GET]().timestamp + timeDelta())}
                    y1={yScaleROR(appState().rorLinearStartSig[GET]().value)}
                    x2={xScale(appState().rorLinearEndSig[GET]().timestamp + timeDelta())}
                    y2={yScaleROR(appState().rorLinearEndSig[GET]().value)}
                ></line>
                <foreignObject clip-path="url(#clip-path)" width="100%" height="100%" pointer-events="none"
                    x={xScale(appState().rorLinearEndSig[GET]().timestamp + timeDelta()) - 60}
                    y={yScaleROR(appState().rorLinearEndSig[GET]().value) - 10}
                >
                    <div class="absolute shadow-[1px_1px_0px_0px] shadow-gray-500 bg-white border rounded-sm text-xs px-0.5"
                        style={`color: #00BB00;`}>
                        {(appState().rorLinearSlopeSig[GET]() * 60).toFixed(2)}
                    </div>
                </foreignObject>
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
                        <Show when={c.dataArr().length > 0}>
                            <ToolTip
                                direction={ToolTipDirection.RIGHT}
                                x={xScale(c.dataArr()[c.dataArr().length - 1].timestamp + timeDelta())}
                                y={yScale(c.dataArr()[c.dataArr().length - 1].value)}
                                text={c.dataArr()[c.dataArr().length - 1].value.toFixed(1)}
                                color={c.color}
                            />
                        </Show>
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
                <Show when={bt.dataArr().length > 0}>
                    <ToolTip
                        direction={ToolTipDirection.RIGHT}
                        x={xScale(bt.dataArr()[bt.dataArr().length - 1].timestamp + timeDelta())}
                        y={yScale(bt.dataArr()[bt.dataArr().length - 1].value)}
                        text={bt.dataArr()[bt.dataArr().length - 1].value.toFixed(1)}
                        color={bt.color}
                    />
                </Show>
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
                <Show when={bt.rorFilteredArrSig[GET]().length > 0}>
                    <ToolTip
                        direction={ToolTipDirection.RIGHT}
                        x={xScale(bt.rorFilteredArrSig[GET]()[bt.rorFilteredArrSig[GET]().length - 1].timestamp + timeDelta())}
                        y={yScaleROR(bt.rorFilteredArrSig[GET]()[bt.rorFilteredArrSig[GET]().length - 1].value)}
                        text={bt.rorFilteredArrSig[GET]()[bt.rorFilteredArrSig[GET]().length - 1].value.toFixed(1)}
                        color={bt.color}
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