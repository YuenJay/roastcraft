// SPDX-License-Identifier: GPL-3.0-or-later

import { For, } from "solid-js";
import { GET, SET, Point, appStateSig } from "./AppState";

export default function RangeInput(props: any) {

    const [appState, _setAppState] = appStateSig;
    const [timer, _setTimer] = appState().timerSig;
    const [manualChannelArr, _setManualChannelArr] = appState().manualChannelArrSig;

    let min = 0;
    let max = 100;
    let step = 10;
    let defaultValue = 20;

    let pips: number[] = [];
    for (let i = 0; i < max / step; i++) {
        pips.push(min + i * step);
    }
    pips.push(max);

    console.log("manual chart pips");
    console.log(pips);

    async function handleInput(event: InputEvent) {

        let value = (event.target as HTMLInputElement).value;
        console.log(value);

        manualChannelArr()[0].currentDataSig[SET](Number(value));
        manualChannelArr()[0].dataSig[SET](
            [...manualChannelArr()[0].dataSig[GET](), new Point(timer(), Number(value))]
        );

    }

    return (
        <>
            <p class="text-right">
                {props.id}
            </p>
            <input
                type="range"
                class="range range-primary range-xs"
                min={min}
                max={max}
                value={defaultValue}
                step={step}
                onInput={handleInput}
            />
            <div class="w-full flex justify-between text-xs px-2 pb-4 relative">
                <For each={pips}>
                    {(pip) => (
                        <span class="h-2 w-px bg-black">
                            <span class="absolute -translate-x-1/2 translate-y-1/2" >{pip}</span>
                        </span>
                    )}
                </For>

            </div>
        </>
    );
}