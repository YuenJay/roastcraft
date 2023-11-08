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

    let metrics: any[] = config.serial.modbus.slave.map((s: any) => ({
        id: s.metrics_id,
        label: s.label,
        unit: s.unit,
        data: []
    }));

    // move BT to be the first element
    let bt_index = metrics.findIndex((m: any) => (m.id == "BT"));
    metrics.unshift(metrics.splice(bt_index, 1)[0]);

    return {
        appState: AppState.OFF,
        config: config,
        timer: 0,
        BT: 0.0,
        metrics: metrics,
        metrics_id_list: metrics.map((m: any) => (m.id)), // metrics order is the same
        logs: new Array<String>()
    }
}

export default createStore(await init_store())



