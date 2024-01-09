// SPDX-License-Identifier: GPL-3.0-or-later

import { createEffect, createSignal, onMount } from "solid-js";
import { SET, appStateSig } from "./AppState";

export default function SettingsPanel(props: any) {

    const [appState, _setAppState] = appStateSig;

    createEffect(() => {

    });

    return (
        <>
            <div class="flex flex-wrap">
                <label class="label cursor-pointer basis-1/3">
                    <span class="label-text mr-1">ROR filtered</span>
                    <input type="checkbox" class="toggle toggle-sm toggle-primary" onChange={(e) => {
                        appState().toggleShowRorFilteredSig[SET](Boolean(e.currentTarget.checked));
                    }} />
                </label>
                <label class="label cursor-pointer basis-1/3">
                    <span class="label-text mr-1">ROR outlier</span>
                    <input type="checkbox" class="toggle toggle-sm toggle-primary" onChange={(e) => {
                        appState().toggleShowRorOutlierSig[SET](Boolean(e.currentTarget.checked));
                    }} />
                </label>
                <label class="label cursor-pointer basis-1/3">
                    <span class="label-text mr-1">ROR regression</span>
                    <input type="checkbox" class="toggle toggle-sm toggle-primary" onChange={(e) => {
                        appState().toggleShowRorRegressionSig[SET](Boolean(e.currentTarget.checked));
                    }} />
                </label>
                {/* <label class="label">
                        <span class="label-text ml-auto mr-2">ROR zscore</span>
                        <input type="number" id="zscore" name="zscore" min="2" max="4" step="0.1" value="3" class="input input-bordered input-sm" />
                    </label> */}

            </div>
        </>

    )
}