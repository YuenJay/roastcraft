// SPDX-License-Identifier: GPL-3.0-or-later

import { createStore } from 'solid-js/store'
import { invoke } from "@tauri-apps/api/tauri";
import { Signal, createSignal } from 'solid-js';

export const GET = 0
export const SET = 1

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
    currentDataSig: Signal<number> = createSignal(0);    // current 
    currentRorSig: Signal<number> = createSignal(0);     // current 
    data_window: Array<any> = [];   // current, for calculate ror
    dataSig: Signal<Array<Point>> = createSignal(new Array<Point>());        // history records
    rorSig: Signal<Array<Point>> = createSignal(new Array<Point>());         // history records
    rorOutlierSig: Signal<Array<Point>> = createSignal(new Array<Point>());  // history records
    rorFilteredSig: Signal<Array<Point>> = createSignal(new Array<Point>()); // history records
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

export enum AppStatus {
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

    return {

        // events: new Array<Event>(),
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
        ROR_linear_start: { timestamp: 0, value: 0 },
        ROR_linear_end: { timestamp: 0, value: 0 },
        Drying_Phase: new Phase(0, 0.0, 0.0),
        Maillard_Phase: new Phase(0, 0.0, 0.0),
        Develop_Phase: new Phase(0, 0.0, 0.0),
        RoastPhase: RoastPhase.BEFORE_CHARGE
    }
}

export default createStore(await init_store())

export class ManualMetric {
    id: string;
    currentDataSig: Signal<number>;
    dataSig: Signal<Point[]>;

    constructor(id: string, currentDataSig: Signal<number>, dataSig: Signal<Point[]>) {
        this.id = id;
        this.currentDataSig = currentDataSig;
        this.dataSig = dataSig;
    }
}

async function init_manualMetrics() {

    let manualMetrics: Array<ManualMetric> = new Array<ManualMetric>();

    manualMetrics.push(
        new ManualMetric(
            "gas",
            createSignal(40),
            createSignal([new Point(0, 40)])
        )
    );

    return manualMetrics;
}

export const manualMetricsSig = createSignal(await init_manualMetrics());


async function init_appStateSig() {
    // get config from backend
    let config: any;
    await invoke("get_config").then(c => config = c);

    let metrics: Metric[] = config.tcp.http.channel.map((s: any) => (
        {
            id: s.metrics_id,
            label: s.label,
            unit: s.unit,
            color: s.color,
            ror_enabled: s.ror_enabled,
            ror_color: s.ror_color,
            currentDataSig: createSignal(0),
            currentRorSig: createSignal(0),
            data_window: [],
            dataSig: createSignal(new Array<Point>()),
            rorSig: createSignal(new Array<Point>()),
            rorOutlierSig: createSignal(new Array<Point>()),
            rorFilteredSig: createSignal(new Array<Point>()),
        } as Metric
    ));

    // move BT to be the first element
    let bt_index = metrics.findIndex(m => m.id == "BT");
    metrics.unshift(metrics.splice(bt_index, 1)[0]);

    return {
        statusSig: createSignal(AppStatus.OFF),
        timerSig: createSignal(0),
        timeDeltaSig: createSignal(0),
        metricsSig: createSignal(metrics),
        metricsIdListSig: createSignal(metrics.map(m => m.id)), // metrics order is the same
        logsSig: createSignal(new Array<string>()),
        eventsSig: createSignal(new Array<Event>()),
    }
}

export const appStateSig = createSignal(await init_appStateSig());

