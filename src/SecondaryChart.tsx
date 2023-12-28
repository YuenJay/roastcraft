// SPDX-License-Identifier: GPL-3.0-or-later

import { For, onMount, } from "solid-js";
import * as d3 from "d3";
import { GET, SET, Point, appStateSig, ManualChannel } from "./AppState";
import { timestamp_format } from "./MainChart";

export default function SecondaryChart(props: { channel_id: string }) {

    const [appState, _setAppState] = appStateSig;
    const [timer, _setTimer] = appState().timerSig;
    const [cursorLineX, setCursorLineX] = appState().cursorLineXSig;
    const [manualChannelArr, _setManualChannelArr] = appState().manualChannelArrSig;

    let mc = manualChannelArr().find(mc => mc.id == props.channel_id) as ManualChannel;

    const width = 800;
    const height = 100;
    const marginTop = 14;
    const marginRight = 30;
    const marginBottom = 14;
    const marginLeft = 30;

    const xScale = d3.scaleLinear(
        [-60, 720],
        [marginLeft, width - marginRight]
    );

    const yScale = d3.scaleLinear([mc.min, mc.max], [
        height - marginBottom,
        marginTop,
    ]);

    const line = d3.line()
        .x((d: any) => xScale(d.timestamp + appState().timeDeltaSig[GET]()))
        .y((d: any) => yScale(d.value))
        .curve(d3.curveStepAfter);

    let svgRef: SVGSVGElement | undefined;

    onMount(() => {
        if (svgRef) {

            const svg = d3.select(svgRef);

            svg.append("g")
                .attr("transform", `translate(0, ${height - marginBottom} )`)
                .call(d3.axisBottom(xScale)
                    .tickValues(d3.range(0, 720, 60))
                )
                .selectAll("text").remove();

            svg.append("g")
                .style("font-size", "0.5em")
                .attr("transform", `translate(${marginLeft}, 0)`)
                .call(d3.axisLeft(yScale)
                    .tickValues([...d3.range(mc.min, mc.max, mc.step), mc.max])
                ).call(g => g.append("text")
                    .attr("x", 0)
                    .attr("y", marginTop - 8)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "end")
                    .text(`${mc.id}`));


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
                    d={line(
                        [...mc.dataArr(), { timestamp: timer(), value: mc.currentDataSig[GET]() }] as any
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