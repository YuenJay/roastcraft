// SPDX-License-Identifier: GPL-3.0-or-later

import { createEffect } from "solid-js";
import { SET, appStateSig } from "./AppState";

export default function SettingsPanel() {

    const [appState, _setAppState] = appStateSig;

    createEffect(() => {

    });

    return (
        <div class="flex flex-col">
            <label class="label cursor-pointer ">
                <span class="label-text mr-1">ROR filtered</span>
                <input type="checkbox" class="toggle toggle-sm toggle-primary" onChange={(e) => {
                    appState().toggleShowRorFilteredSig[SET](Boolean(e.currentTarget.checked));
                }} />
            </label>
            <label class="label cursor-pointer ">
                <span class="label-text mr-1">ROR outlier</span>
                <input type="checkbox" class="toggle toggle-sm toggle-primary" onChange={(e) => {
                    appState().toggleShowRorOutlierSig[SET](Boolean(e.currentTarget.checked));
                }} />
            </label>
        </div>
    )
}