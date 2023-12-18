// SPDX-License-Identifier: GPL-3.0-or-later

import { invoke } from "@tauri-apps/api/tauri";
import { Accessor, Setter, Signal, createSignal } from 'solid-js';

export const GET = 0
export const SET = 1
export const BT = "BT"

export class Point {
    timestamp: number = 0;  // time in seconds
    value: number = 0.0;    // temperature or ror value
    constructor(timestamp: number, value: number) {
        this.timestamp = timestamp;
        this.value = value;
    }
}

export class Channel {
    id: string;
    label: string;
    unit: string;
    color: string;
    ror_color: string;
    currentDataSig: Signal<number>;    // current 
    currentRorSig: Signal<number>;     // current 
    data_window: Array<any>;           // current, for calculate ror
    data: Accessor<Point[]>;           // history records
    setData: Setter<Point[]>;          // history records
    rorSig: Signal<Array<Point>>;         // history records
    rorOutlierSig: Signal<Array<Point>>;  // history records
    rorFilteredSig: Signal<Array<Point>>; // history records
    rorConvolveSig: Signal<Array<Point>>; // history records

    constructor(
        id: string,
        label: string,
        unit: string,
        color: string,
        ror_color: string,
        currentDataSig: Signal<number>,
        currentRorSig: Signal<number>,
        data_window: Array<any>,
        dataSig: Signal<Array<Point>>,
        rorSig: Signal<Array<Point>>,
        rorOutlierSig: Signal<Array<Point>>,
        rorFilteredSig: Signal<Array<Point>>,
        rorConvolveSig: Signal<Array<Point>>,) {
        this.id = id;
        this.label = label;
        this.unit = unit;
        this.color = color;
        this.ror_color = ror_color;
        this.currentDataSig = currentDataSig;
        this.currentRorSig = currentRorSig;
        this.data_window = data_window;
        this.data = dataSig[GET];
        this.setData = dataSig[SET];
        this.rorSig = rorSig;
        this.rorOutlierSig = rorOutlierSig;
        this.rorFilteredSig = rorFilteredSig;
        this.rorConvolveSig = rorConvolveSig;

    }
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

export class ManualChannel {
    id: string;
    currentDataSig: Signal<number>;
    dataSig: Signal<Point[]>;

    constructor(id: string, currentDataSig: Signal<number>, dataSig: Signal<Point[]>) {
        this.id = id;
        this.currentDataSig = currentDataSig;
        this.dataSig = dataSig;
    }
}

async function init_appStateSig() {
    // get config from backend
    let config: any;
    await invoke("get_config").then(c => config = c);

    console.log(config);
    let channelList: Channel[];
    if (config.serial != null) {
        channelList = config.serial.modbus.slave.map((s: any) =>
            new Channel(
                s.channel_id,    // id
                s.label,         // label 
                s.unit,          // unit
                s.color,         // color
                s.ror_color,     // ror_color
                createSignal(0), //currentDataSig
                createSignal(0), //currentRorSig
                [], //data_window
                createSignal(new Array<Point>()), // dataSig
                createSignal(new Array<Point>()), // rorSig
                createSignal(new Array<Point>()), // rorOutlierSig
                createSignal(new Array<Point>()), // rorFilteredSig
                createSignal(new Array<Point>()), // rorConvolveSig
            )
        );
    } else {
        channelList = config.tcp.http.channel.map((s: any) =>
            new Channel(
                s.channel_id,    // id
                s.label,         // label 
                s.unit,          // unit
                s.color,         // color
                s.ror_color,     // ror_color
                createSignal(0), //currentDataSig
                createSignal(0), //currentRorSig
                [], //data_window
                createSignal(new Array<Point>()), // dataSig
                createSignal(new Array<Point>()), // rorSig
                createSignal(new Array<Point>()), // rorOutlierSig
                createSignal(new Array<Point>()), // rorFilteredSig
                createSignal(new Array<Point>()), // rorConvolveSig
            )
        );
    }


    let btIndex = channelList.findIndex(m => m.id == BT);

    let manualChannelList: Array<ManualChannel> = new Array<ManualChannel>();

    manualChannelList.push(
        new ManualChannel(
            "gas",
            createSignal(20),
            createSignal([new Point(0, 20)])
        )
    );

    return {
        btIndex: btIndex,
        statusSig: createSignal(AppStatus.OFF),
        timerSig: createSignal(0),
        timeDeltaSig: createSignal(0),
        channelListSig: createSignal(channelList),
        manualChannelListSig: createSignal(manualChannelList),
        logsSig: createSignal(new Array<string>()),
        eventsSig: createSignal(new Array<Event>()),
        eventCHARGESig: createSignal(false),
        eventDRY_ENDSig: createSignal(false),
        eventFC_STARTSig: createSignal(false),
        eventFC_ENDSig: createSignal(false),
        eventSC_STARTSig: createSignal(false),
        eventSC_ENDSig: createSignal(false),
        eventDROPSig: createSignal(false),
        eventTPSig: createSignal(false),
        eventROR_TPSig: createSignal(false),
        rorLinearStartSig: createSignal(new Point(0, 0)),
        rorLinearEndSig: createSignal(new Point(0, 0)),
        rorLinearSlopeSig: createSignal(0),
        roastPhaseSig: createSignal(RoastPhase.BEFORE_CHARGE),
        dryingPhaseSig: createSignal(new Phase(0, 0.0, 0.0)),
        maillardPhaseSig: createSignal(new Phase(0, 0.0, 0.0)),
        developPhaseSig: createSignal(new Phase(0, 0.0, 0.0)),
        cursorLineXSig: createSignal(0),
        toggleShowRorFilteredSig: createSignal(false),
        toggleShowRorOutlierSig: createSignal(false),
        toggleShowRorRegressionSig: createSignal(false),
    }
}

export const appStateSig = createSignal(await init_appStateSig());

