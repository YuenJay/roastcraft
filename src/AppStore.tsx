// SPDX-License-Identifier: GPL-3.0-or-later

import { createStore } from 'solid-js/store'
import { invoke } from "@tauri-apps/api/tauri";

export enum AppState {
    OFF,
    ON,
    RECORDING,
    RECORDED
}


async function init_store() {

    // get config from backend
    let config: any;
    await invoke("get_config").then((c) => (config = c))

    return {
        appState: AppState.OFF,
        config: config,
        timer: 0,
        BT: 0.0,
        // metrics: [{ id: "BT", label: "Bean Temp", unit: "celcius", data: new Array() }],
        metrics: config.serial.modbus.slave.map((s: any) => ({
            id: s.metrics_id,
            data: []
        })),
        logs: new Array<String>()
    }
}

export default createStore(await init_store())



