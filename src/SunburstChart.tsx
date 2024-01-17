// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, createEffect, } from "solid-js";
import * as d3 from "d3";
import { appStateSig } from "./AppState";


export default function SunburstChart() {

    const [appState, _setAppState] = appStateSig;

    // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#definite-assignment-assertions
    let svgRef!: SVGSVGElement;

    onMount(() => {
        const svg = d3.select(svgRef);

    });

    createEffect(() => {

    });

    return (

        <svg ref={svgRef} preserveAspectRatio="xMinYMin meet" viewBox={`0 0 360 360`} >





        </svg >
    );
}