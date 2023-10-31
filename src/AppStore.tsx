// SPDX-License-Identifier: GPL-3.0-or-later

import { createStore } from 'solid-js/store'

export enum AppState {
    OFF,
    ON,
    RECORDING,
    RECORDED
}

export default createStore({
    appState: AppState.OFF,
    config: {} as any,
    timer: 0,
    BT: 0.0,
    metrics: [{ id: "BT", label: "Bean Temp", unit: "celcius", data: new Array() }],
    logs: new Array<String>()
})



