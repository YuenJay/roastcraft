// SPDX-License-Identifier: GPL-3.0-or-later

import { For, } from "solid-js";
import { GET, SET, Point, appStateSig, ManualChannel } from "./AppState";

export default function RangeInput(props: { channel_id: string }) {

    const [appState, _setAppState] = appStateSig;
    const [timer, _setTimer] = appState().timerSig;
    const [manualChannelArr, _setManualChannelArr] = appState().manualChannelArrSig;

    let mc = manualChannelArr().find(mc => mc.id == props.channel_id) as ManualChannel;

    let min = mc.min;
    let max = mc.max;
    let step = mc.step;
    let defaultValue = mc.defaultValue;

    let pips: number[] = [];
    for (let i = 0; i < (max - min) / step; i++) {
        pips.push(min + i * step);
    }
    pips.push(max);

    async function handleInput(event: InputEvent) {

        let value = (event.target as HTMLInputElement).value;

        mc.currentDataSig[SET](Number(value));
        mc.setDataArr(
            [...mc.dataArr(), new Point(timer(), Number(value))]
        );

    }

    return (
        <div>
            <div class="label p-0">
                <span class="label-text">{mc.id}</span>
            </div>
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
        </div>
    );
}