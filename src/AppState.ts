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
    rorColor: string;
    currentDataSig: Signal<number>;    // current 
    currentRorSig: Signal<number>;     // current 
    dataWindowArr: Array<any>;           // current, for calculate ror
    dataArr: Accessor<Point[]>;           // history records
    setDataArr: Setter<Point[]>;          // history records
    rorArrSig: Signal<Array<Point>>;         // history records
    rorOutlierArrSig: Signal<Array<Point>>;  // history records
    rorFilteredArrSig: Signal<Array<Point>>; // history records
    rorConvolveArrSig: Signal<Array<Point>>; // history records

    constructor(
        id: string,
        label: string,
        unit: string,
        color: string,
        rorColor: string,
        currentDataSig: Signal<number>,
        currentRorSig: Signal<number>,
        dataWindowArr: Array<any>,
        dataArrSig: Signal<Array<Point>>,
        rorArrSig: Signal<Array<Point>>,
        rorOutlierArrSig: Signal<Array<Point>>,
        rorFilteredArrSig: Signal<Array<Point>>,
        rorConvolveArrSig: Signal<Array<Point>>,) {
        this.id = id;
        this.label = label;
        this.unit = unit;
        this.color = color;
        this.rorColor = rorColor;
        this.currentDataSig = currentDataSig;
        this.currentRorSig = currentRorSig;
        this.dataWindowArr = dataWindowArr;
        this.dataArr = dataArrSig[GET];
        this.setDataArr = dataArrSig[SET];
        this.rorArrSig = rorArrSig;
        this.rorOutlierArrSig = rorOutlierArrSig;
        this.rorFilteredArrSig = rorFilteredArrSig;
        this.rorConvolveArrSig = rorConvolveArrSig;

    }
}

export class RoastEvent {
    id: RoastEventId;
    timestamp: number;  // time in seconds
    value: number;    // temperature or ror value
    constructor(id: RoastEventId, timestamp: number, value: number) {
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

export enum RoastEventId {
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

export interface RoastEvents {
    CHARGE: RoastEvent | undefined,
    DRY_END: RoastEvent | undefined,
    FC_START: RoastEvent | undefined,
    FC_END: RoastEvent | undefined,
    SC_START: RoastEvent | undefined,
    SC_END: RoastEvent | undefined,
    DROP: RoastEvent | undefined,
    TP: RoastEvent | undefined,
    ROR_TP: RoastEvent | undefined,
}

export enum AppStatus {
    OFF = 'OFF',
    ON = 'ON',
    RECORDING = 'RECORDING',
}

export class ManualChannel {
    id: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    currentDataSig: Signal<number>;
    dataArr: Accessor<Point[]>;           // history records
    setDataArr: Setter<Point[]>;          // history records

    constructor(
        id: string,
        min: number,
        max: number,
        step: number,
        defaultValue: number,
        currentDataSig: Signal<number>,
        dataArrSig: Signal<Point[]>) {
        this.id = id;
        this.min = min;
        this.max = max;
        this.step = step;
        this.defaultValue = defaultValue;
        this.currentDataSig = currentDataSig;
        this.dataArr = dataArrSig[GET];
        this.setDataArr = dataArrSig[SET];
    }
}

export class Ghost {

    timeDelta: number;
    channelArr: Array<GhostChannel>;
    manualChannelArr: Array<GhostManualChannel>;
    roastEvents: RoastEvents;
    dryingPhase: Phase;
    maillardPhase: Phase;
    developPhase: Phase;

    constructor(
        timeDelta: number,
        channelArr: Array<GhostChannel>,
        manualChannelArr: Array<GhostManualChannel>,
        roastEvents: RoastEvents,
    ) {
        this.timeDelta = timeDelta;
        this.channelArr = channelArr;
        this.manualChannelArr = manualChannelArr;
        this.roastEvents = roastEvents;
        this.dryingPhase = new Phase(0, 0.0, 0.0);
        this.maillardPhase = new Phase(0, 0.0, 0.0);
        this.developPhase = new Phase(0, 0.0, 0.0);
    }
}

export class GhostChannel {
    id: string;
    color: string;
    rorColor: string;
    dataArr: Array<Point>;
    rorConvolveArr: Array<Point>;

    constructor(
        id: string,
        color: string,
        rorColor: string,
        dataArr: Array<Point>,
        rorConvolveArr: Array<Point>,
    ) {
        this.id = id;
        this.color = color;
        this.rorColor = rorColor;
        this.dataArr = dataArr;
        this.rorConvolveArr = rorConvolveArr;
    }
}

export class GhostManualChannel {
    id: string;
    dataArr: Array<Point>;

    constructor(
        id: string,
        dataArr: Array<Point>,
    ) {
        this.id = id;
        this.dataArr = dataArr;
    }
}

export class RoastProperty {
    title: string = "";
    weightGreen = 0;
    weightRoasted = 0;
    weightUnit = "g";
    weightLossPercentage = 0;
    colorWhole = 0;
    colorGround = 0;
    colorUnit = "Agtron";
    roastingNotes = "";
    cuppingNotes = "";
}

function init_ghostSig() {
    let timeDelta = 0;
    let channelArr = [new GhostChannel("", "", "", new Array<Point>, new Array<Point>)]
    let manualChannelArr = new Array<GhostManualChannel>;
    return new Ghost(timeDelta, channelArr, manualChannelArr, {} as RoastEvents);
}

async function init_appStateSig() {
    // get config from backend
    let config: any;
    await invoke("get_config").then(c => config = c);

    console.log("config");
    console.log(config);

    let channelArr: Channel[];
    if (config.serial != null) {
        channelArr = config.serial.modbus.slave.map((s: any) =>
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
        channelArr = config.tcp.http.channel.map((s: any) =>
            new Channel(
                s.channel_id,    // id
                s.label,         // label 
                s.unit,          // unit
                s.color,         // color
                s.ror_color,     // ror_color
                createSignal(0), // currentDataSig
                createSignal(0), // currentRorSig
                [], //data_window
                createSignal(new Array<Point>()), // dataSig
                createSignal(new Array<Point>()), // rorSig
                createSignal(new Array<Point>()), // rorOutlierSig
                createSignal(new Array<Point>()), // rorFilteredSig
                createSignal(new Array<Point>()), // rorConvolveSig
            )
        );
    }

    let manualChannelArr: Array<ManualChannel> = new Array<ManualChannel>();

    if (config.manual_channel != null) {
        manualChannelArr = config.manual_channel.map((c: any) =>
            new ManualChannel(
                c.channel_id,
                c.min,
                c.max,
                c.step,
                c.default_value,
                createSignal(c.default_value),
                createSignal([new Point(0, c.default_value)])
            )
        );
    }

    return {
        statusSig: createSignal(AppStatus.OFF),
        timerSig: createSignal(0),
        timeDeltaSig: createSignal(0),
        channelArrSig: createSignal(channelArr),
        manualChannelArrSig: createSignal(manualChannelArr),
        logArrSig: createSignal(new Array<string>()),
        roastEventsSig: createSignal({
            CHARGE: undefined,
            DRY_END: undefined,
            FC_START: undefined,
            FC_END: undefined,
            SC_START: undefined,
            SC_END: undefined,
            DROP: undefined,
            TP: undefined,
            ROR_TP: undefined,
        } as RoastEvents),
        rorLinearStartSig: createSignal(new Point(0, 0)),
        rorLinearEndSig: createSignal(new Point(0, 0)),
        rorLinearSlopeSig: createSignal(0),
        dryingPhaseSig: createSignal(new Phase(0, 0.0, 0.0)),
        maillardPhaseSig: createSignal(new Phase(0, 0.0, 0.0)),
        developPhaseSig: createSignal(new Phase(0, 0.0, 0.0)),
        cursorLineXSig: createSignal(0),
        cursorTimestampSig: createSignal(0),
        cursorIndexSig: createSignal(0),
        toggleShowRorFilteredSig: createSignal(false),
        toggleShowRorOutlierSig: createSignal(false),
        toggleShowRorRegressionSig: createSignal(false),
        isGhostLoadedSig: createSignal(false),
        ghostSig: createSignal(init_ghostSig()),
        currentTabIdSig: createSignal(0),
        phaseChartWidthSig: createSignal(360),
        titleSig: createSignal(""),
    }
}

export const appStateSig = createSignal(await init_appStateSig());

export function reset() {
    const [appState, _setAppState] = appStateSig;
    const [channelArr, _setChannelArr] = appState().channelArrSig;
    const [manualChannelArr, _setManualChannelArr] = appState().manualChannelArrSig;

    appState().timerSig[SET](0);
    appState().timeDeltaSig[SET](0);

    // reset channelArr
    channelArr().forEach((channel) => {
        channel.currentDataSig[SET](0);
        channel.currentRorSig[SET](0);
        channel.dataWindowArr = [];
        channel.setDataArr(new Array<Point>());
        channel.rorArrSig[SET](new Array<Point>());
        channel.rorOutlierArrSig[SET](new Array<Point>());
        channel.rorFilteredArrSig[SET](new Array<Point>());
        channel.rorConvolveArrSig[SET](new Array<Point>());
    })

    manualChannelArr().forEach((mc) => {
        mc.currentDataSig[SET](mc.defaultValue);
        mc.setDataArr([new Point(0, mc.defaultValue)]);
    });

    // not reset logs
    // appState().logArrSig[SET](new Array<string>());   

    appState().roastEventsSig[SET]({
        CHARGE: undefined,
        DRY_END: undefined,
        FC_START: undefined,
        FC_END: undefined,
        SC_START: undefined,
        SC_END: undefined,
        DROP: undefined,
        TP: undefined,
        ROR_TP: undefined,
    } as RoastEvents);

    appState().rorLinearStartSig[SET](new Point(0, 0));
    appState().rorLinearEndSig[SET](new Point(0, 0));
    appState().rorLinearSlopeSig[SET](0);
    appState().dryingPhaseSig[SET](new Phase(0, 0.0, 0.0));
    appState().maillardPhaseSig[SET](new Phase(0, 0.0, 0.0));
    appState().developPhaseSig[SET](new Phase(0, 0.0, 0.0));
    appState().cursorLineXSig[SET](0);
    appState().toggleShowRorFilteredSig[SET](false);
    appState().toggleShowRorOutlierSig[SET](false);
    appState().toggleShowRorRegressionSig[SET](false);

}

export function resetGhost() {
    const [appState, _setAppState] = appStateSig;
    appStateSig[GET]().ghostSig[SET](init_ghostSig());
    appState().isGhostLoadedSig[SET](false);
}