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

    // todo: choose device based on config
    // let metrics: any[] = config.serial.modbus.slave.map((s: any) => ({
    //     id: s.metrics_id,
    //     label: s.label,
    //     unit: s.unit,
    //     color: s.color,
    //     ror_enabled: s.ror_enabled,
    //     ror_color: s.ror_color,
    //     current_reading: {}, // current 
    //     rate_of_rise: {},    // current
    //     readings_buffer: [], // current
    //     data: [],            // history
    //     ror_data: []         // history 
    // }));

    let metrics: any[] = config.tcp.http.channel.map((s: any) => ({
        id: s.metrics_id,
        label: s.label,
        unit: s.unit,
        color: s.color,
        ror_enabled: s.ror_enabled,
        ror_color: s.ror_color,
        current_reading: 0, // current 
        rate_of_rise: 0,    // current
        readings_buffer: [], // current
        data: [],            // history
        ror_data: []         // history 
    }));

    // move BT to be the first element
    let bt_index = metrics.findIndex((m: any) => (m.id == "BT"));
    metrics.unshift(metrics.splice(bt_index, 1)[0]);

    return {
        appState: AppState.OFF,
        config: config,
        timer: 0,
        metrics: metrics,
        metrics_id_list: metrics.map((m: any) => (m.id)), // metrics order is the same
        logs: new Array<String>(),
        events: new Array(),
        phase_button_state: { CHARGE: false, DRY_END: false }
    }
}

export default createStore(await init_store())



