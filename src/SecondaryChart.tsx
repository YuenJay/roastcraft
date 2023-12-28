// SPDX-License-Identifier: GPL-3.0-or-later

import { For, onMount, } from "solid-js";
import * as d3 from "d3";
import { GET, SET, Point, appStateSig, ManualChannel } from "./AppState";
import { timestamp_format } from "./MainChart";

export default function SecondaryChart(props: { channelA_id: string, channelB_id?: string }) {

    const [appState, _setAppState] = appStateSig;
    const [timer, _setTimer] = appState().timerSig;
    const [cursorLineX, setCursorLineX] = appState().cursorLineXSig;
    const [manualChannelArr, _setManualChannelArr] = appState().manualChannelArrSig;

    let mcA = manualChannelArr().find(mc => mc.id == props.channelA_id) as ManualChannel;
    let mcB = manualChannelArr().find(mc => mc.id == props.channelB_id) as ManualChannel;

    const width = 800;
    const height = 160;
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 20;
    const marginLeft = 30;

    const xScale = d3.scaleLinear(
        [-60, 720],
        [marginLeft, width - marginRight]
    );

    const yScaleA = d3.scaleLinear([mcA.min, mcA.max], [
        height - marginBottom,
        marginTop,
    ]);

    const yScaleB = d3.scaleLinear([mcB.min, mcB.max], [
        height - marginBottom,
        marginTop,
    ]);

    const lineA = d3.line()
        .x((d: any) => xScale(d.timestamp + appState().timeDeltaSig[GET]()))
        .y((d: any) => yScaleA(d.value))
        .curve(d3.curveStepAfter);

    const lineB = d3.line()
        .x((d: any) => xScale(d.timestamp + appState().timeDeltaSig[GET]()))
        .y((d: any) => yScaleB(d.value))
        .curve(d3.curveStepAfter);

    let svgRef: SVGSVGElement | undefined;

    onMount(() => {
        if (svgRef) {

            const svg = d3.select(svgRef);
            svg.append("g")
                .attr("transform", `translate(0, ${height - marginBottom} )`)
                .call(d3.axisBottom(xScale)
                    .tickValues(d3.range(0, 720, 60))
                    .tickFormat((d) => timestamp_format(d as number)));

            svg.append("g")
                .attr("transform", `translate(${marginLeft}, 0)`)
                .call(d3.axisLeft(yScaleA))
                .call(g => g.append("text")
                    .attr("x", 0)
                    .attr("y", marginTop - 10)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "end")
                    .text(`${mcA.id}`));


            svg.append("g")
                .attr("transform", `translate(${width - marginRight}, 0)`)
                .call(d3.axisRight(yScaleB))
                .call(g => g.append("text")
                    .attr("x", 0)
                    .attr("y", marginTop - 10)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "start")
                    .text(`${mcB.id}`));


            svg.on("mousemove", (event) => {
                setCursorLineX(d3.pointer(event)[0]);
                // console.log(xScale.invert(d3.pointer(event)[0]));
            });
        }
    });

    return (
        <>
            <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox={`0 0 ${width} ${height}`} >
                <defs>
                    {/* Defines clipping area, rect is inside axis*/}
                    <clipPath
                        clipPathUnits="userSpaceOnUse"
                        id="clip-path-input-0">
                        <rect x={marginLeft} y={marginTop} width={width - marginLeft - marginRight} height={height - marginTop - marginBottom} />
                    </clipPath>
                </defs>
                <path
                    fill="none"
                    stroke="blue"
                    stroke-width="1.5"
                    d={lineA(
                        [...mcA.dataArr(), { timestamp: timer(), value: mcA.currentDataSig[GET]() }] as any
                    ) as string | undefined}
                />
                <path
                    fill="none"
                    stroke="red"
                    stroke-width="1.5"
                    d={lineB(
                        [...mcB.dataArr(), { timestamp: timer(), value: mcB.currentDataSig[GET]() }] as any
                    ) as string | undefined}
                />
                <line stroke="#00FF00"
                    stroke-width="1"
                    clip-path="url(#clip-path-input-0)"
                    x1={cursorLineX()}
                    y1={marginTop}
                    x2={cursorLineX()}
                    y2={height - marginBottom}
                ></line>
            </svg>
        </>
    );
}