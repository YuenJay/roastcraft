// SPDX-License-Identifier: GPL-3.0-or-later

import { createStore } from 'solid-js/store'
import { invoke } from "@tauri-apps/api/tauri";

export class Point {
    timestamp: number = 0;  // time in seconds
    value: number = 0.0;    // temperature or ror value
    constructor(timestamp: number, value: number) {
        this.timestamp = timestamp;
        this.value = value;
    }
}

export class Metric {
    id: string = "";
    label: string = "";
    unit: string = "";
    color: string = "";
    ror_enabled: boolean = false;
    ror_color: string = "";
    current_data: number = 0.0;     // current 
    current_ror: number = 0.0;      // current
    data_window: Array<any> = [];   // current, for calculate ror
    data: Array<Point> = [];        // history records
    ror: Array<Point> = [];         // history records
    ror_outlier: Array<Point> = []; // history records
    ror_filtered: Array<Point> = [];// history records
}

export class Event {
    id: EventId;
    timestamp: number;  // time in seconds
    value: number;    // temperature or ror value
    constructor(id: EventId, timestamp: number, value: number) {
        this.id = id;
        this.timestamp = timestamp;
        this.value = value;
    }
}

export class Phase {
    time: number // time in seconds
    percent: number;
    temp_rise: number;
    constructor(time: number, percent: number, temp_rise: number) {
        this.time = time;
        this.percent = percent;
        this.temp_rise = temp_rise;
    }
}

export enum EventId {
    CHARGE = 'CHARGE',
    DRY_END = 'DRY_END',
    FC_START = 'FC_START',
    FC_END = 'FC_END',
    SC_START = 'SC_START',
    SC_END = 'SC_END',
    DROP = 'DROP',
    TP = 'TP',
    ROR_TP = 'ROR_TP'
}

export enum AppState {
    OFF = 'OFF',
    ON = 'ON',
    RECORDING = 'RECORDING',
    RECORDED = 'RECORDED'
}

export enum RoastPhase {
    BEFORE_CHARGE = 'BEFORE_CHARGE',
    DRYING = 'DRYING',
    MAILLARD = 'MAILLARD',
    DEVELOP = 'DEVELOP',
    AFTER_DROP = 'AFTER_DROP',
}

async function init_store() {

    // get config from backend
    let config: any;
    await invoke("get_config").then(c => config = c)

    // todo: choose device based on config
    // let metrics: any[] = config.serial.modbus.slave.map((s: any) => ({
    //     id: s.metrics_id,
    //     label: s.label,
    //     unit: s.unit,
    //     color: s.color,
    //     ror_enabled: s.ror_enabled,
    //     ror_color: s.ror_color,
    //     current_data: {}, // current 
    //     current_ror: {},    // current
    //     data_window: [], // current
    //     data: [],            // history
    //     ror: []         // history 
    // }));

    let metrics: Metric[] = config.tcp.http.channel.map((s: any) => ({
        id: s.metrics_id,
        label: s.label,
        unit: s.unit,
        color: s.color,
        ror_enabled: s.ror_enabled,
        ror_color: s.ror_color,
        current_data: 0,
        current_ror: 0,
        data_window: [],
        data: new Array<Point>(),
        ror: new Array<Point>(),
        ror_outlier: new Array<Point>(),
        ror_filtered: new Array<Point>(),
    }));

    // move BT to be the first element
    let bt_index = metrics.findIndex(m => m.id == "BT");
    metrics.unshift(metrics.splice(bt_index, 1)[0]);

    return {
        appState: AppState.OFF,
        config: config,
        timer: 0,
        metrics: metrics,
        metrics_id_list: metrics.map(m => m.id), // metrics order is the same
        logs: new Array<String>(),
        events: new Array<Event>(),
        event_state: {
            CHARGE: false,
            DRY_END: false,
            FC_START: false,
            FC_END: false,
            SC_START: false,
            SC_END: false,
            DROP: false,
            TP: false,
            ROR_TP: false,
        },
        time_delta: 0,
        ROR_linear_start: { timestamp: 0, value: 0 },
        ROR_linear_end: { timestamp: 0, value: 0 },
        Drying_Phase: new Phase(0, 0.0, 0.0),
        Maillard_Phase: new Phase(0, 0.0, 0.0),
        Develop_Phase: new Phase(0, 0.0, 0.0),
        RoastPhase: RoastPhase.BEFORE_CHARGE
    }
}

export default createStore(await init_store())



