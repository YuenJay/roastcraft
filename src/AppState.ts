// SPDX-License-Identifier: GPL-3.0-or-later

import { invoke } from "@tauri-apps/api/tauri";
import { Accessor, Setter, Signal, createSignal } from 'solid-js';

export const GET = 0
export const SET = 1
export const BT = "BT"

export function init_flavorWheel(): any {
    return {
        name: "root", checked: false,
        children:
            [
                {
                    name: "Green/Vegetative", checked: false,
                    children: [
                        { name: "Olive Oil", checked: false, },
                        { name: "Raw", checked: false, },
                        { name: "Beany", checked: false, },
                        {
                            name: "Green/Vegetative ", checked: false,
                            children: [
                                { name: "Under-Ripe", checked: false, },
                                { name: "Peapod", checked: false, },
                                { name: "Fresh", checked: false, },
                                { name: "Dark Green", checked: false, },
                                { name: "Vegetative", checked: false, },
                                { name: "Hay-Like", checked: false, },
                                { name: "Herb-Like", checked: false, },
                            ]
                        }
                    ]
                },
                {
                    name: "Sour/Fermented", checked: false,
                    children: [
                        {
                            name: "Sour", checked: false,
                            children: [
                                { name: "Sour Aromatics", checked: false, },
                                { name: "Acetic Acid", checked: false, },
                                { name: "Butyric Acid", checked: false, },
                                { name: "Isovaleric Acid", checked: false, },
                                { name: "Citric Acid", checked: false, },
                                { name: "Malic Acid", checked: false, },
                            ]
                        },
                        {
                            name: "Alcohol/Fermented", checked: false,
                            children: [
                                { name: "Winey", checked: false, },
                                { name: "Whiskey", checked: false, },
                                { name: "Fermented", checked: false, },
                                { name: "Overripe", checked: false, },
                            ]
                        }
                    ]
                },
                {
                    name: "Fruity", checked: false,
                    children: [
                        {
                            name: "Berry", checked: false,
                            children: [
                                { name: "Blackberry", checked: false, },
                                { name: "Raspberry", checked: false, },
                                { name: "Blueberry", checked: false, },
                                { name: "Strawberry", checked: false, },
                            ]
                        },
                        {
                            name: "Dried Fruit", checked: false,
                            children: [
                                { name: "Raisin", checked: false, },
                                { name: "Prune", checked: false, },
                            ]
                        }
                    ]
                },
                {
                    name: "Floral", checked: false,
                    children: [
                        { name: "Black Tea", checked: false, },
                        {
                            name: "Floral ", checked: false,
                            children: [
                                { name: "Chamomile", checked: false, },
                                { name: "Rose", checked: false, },
                                { name: "Jasmine", checked: false, },
                            ]
                        }
                    ]
                },
                {
                    name: "Sweet", checked: false,
                    children: [
                        { name: "Sweet Aromatics", checked: false, },
                        { name: "Overall Sweet", checked: false, },
                        { name: "Vanillin", checked: false, },
                        { name: "Vanilla", checked: false, },
                        {
                            name: "Brown Sugar", checked: false,
                            children: [
                                { name: "Honey", checked: false, },
                                { name: "Caramelized", checked: false, },
                                { name: "Maple Syrup", checked: false, },
                                { name: "Molasses", checked: false, },
                            ]
                        }
                    ]
                },
                {
                    name: "Nutty/Cocoa", checked: false,
                    children: [
                        {
                            name: "Nutty", checked: false,
                            children: [
                                { name: "Almond", checked: false, },
                                { name: "Hazelnut", checked: false, },
                                { name: "Peanuts", checked: false, },
                            ]
                        },
                        {
                            name: "Cocoa", checked: false,
                            children: [
                                { name: "Dark Chocolate", checked: false, },
                                { name: "Chocolate", checked: false, },
                            ]
                        }
                    ]
                },
                {
                    name: "Spices", checked: false,
                    children: [
                        { name: "Pepper", checked: false, },
                        { name: "Pungent", checked: false, },
                        {
                            name: "Brown Spice", checked: false,
                            children: [
                                { name: "Clove", checked: false, },
                                { name: "Cinnamon", checked: false, },
                                { name: "Nutmeg", checked: false, },
                                { name: "Anise", checked: false, },
                            ]
                        },
                    ]
                },
                {
                    name: "Roasted", checked: false,
                    children: [
                        { name: "Tobacco", checked: false, },
                        { name: "Pipe Tobacco", checked: false, },
                        {
                            name: "Cereal", checked: false,
                            children: [
                                { name: "Malt", checked: false, },
                                { name: "Grain", checked: false, },
                            ]
                        },
                        {
                            name: "Burnt", checked: false,
                            children: [
                                { name: "Brown, Roast", checked: false, },
                                { name: "Smoky", checked: false, },
                                { name: "Ashy", checked: false, },
                                { name: "Acrid", checked: false, },
                            ]
                        },
                    ]
                },
                {
                    name: "Other", checked: false,
                    children: [
                        {
                            name: "Papery/Musty", checked: false,
                            children: [
                                { name: "Phenolic", checked: false, },
                                { name: "Meaty Brothy", checked: false, },
                                { name: "Animalic", checked: false, },
                                { name: "Musty/Earthy", checked: false, },
                                { name: "Musty/Dusty", checked: false, },
                                { name: "Moldy/Damp", checked: false, },
                                { name: "Woody", checked: false, },
                                { name: "Papery", checked: false, },
                                { name: "Cardboard", checked: false, },
                                { name: "Stale", checked: false, },
                            ]
                        },
                        {
                            name: "Chemical", checked: false,
                            children: [
                                { name: "Rubber", checked: false, },
                                { name: "Skunky", checked: false, },
                                { name: "Petroleum", checked: false, },
                                { name: "Medicinal", checked: false, },
                                { name: "Salty", checked: false, },
                                { name: "Bitter", checked: false, },
                            ]
                        }
                    ]
                },
            ]
    }
}

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
    lastRorConvolveTimestampSig: Signal<number>;
    lastRorConvolveValueSig: Signal<number>;

    constructor(
        id: string,
        label: string,
        color: string,
        rorColor: string,
        currentDataSig: Signal<number>,
        currentRorSig: Signal<number>,
        dataWindowArr: Array<any>,
        dataArrSig: Signal<Array<Point>>,
        rorArrSig: Signal<Array<Point>>,
        rorOutlierArrSig: Signal<Array<Point>>,
        rorFilteredArrSig: Signal<Array<Point>>,
        rorConvolveArrSig: Signal<Array<Point>>,
        lastRorConvolveTimestampSig: Signal<number>,
        lastRorConvolveValueSig: Signal<number>,
    ) {
        this.id = id;
        this.label = label;
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
        this.lastRorConvolveTimestampSig = lastRorConvolveTimestampSig;
        this.lastRorConvolveValueSig = lastRorConvolveValueSig;
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
    TP = 'TP',
    DRY_END = 'DRY_END',
    FC_START = 'FC_START',
    FC_END = 'FC_END',
    SC_START = 'SC_START',
    SC_END = 'SC_END',
    DROP = 'DROP',
}

export interface RoastEvents {
    CHARGE: RoastEvent | undefined,
    TP: RoastEvent | undefined,
    DRY_END: RoastEvent | undefined,
    FC_START: RoastEvent | undefined,
    FC_END: RoastEvent | undefined,
    SC_START: RoastEvent | undefined,
    SC_END: RoastEvent | undefined,
    DROP: RoastEvent | undefined,
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
        if (config.serial.modbus != null) {
            channelArr = config.serial.modbus.slave.map((s: any) =>
                new Channel(
                    s.channel_id,    // id
                    s.label,         // label 
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
                    createSignal(0),
                    createSignal(-100),
                )
            );
        } else {
            channelArr = config.serial.ta612c.channel.map((s: any) =>
                new Channel(
                    s.channel_id,    // id
                    s.label,         // label 
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
                    createSignal(0),
                    createSignal(-100),
                )
            );
        }
    } else {
        channelArr = config.tcp.http.channel.map((s: any) =>
            new Channel(
                s.channel_id,    // id
                s.label,         // label 
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
                createSignal(0),
                createSignal(-100),
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
            TP: undefined,
            DRY_END: undefined,
            FC_START: undefined,
            FC_END: undefined,
            SC_START: undefined,
            SC_END: undefined,
            DROP: undefined,
        } as RoastEvents),
        dryingPhaseSig: createSignal(new Phase(0, 0.0, 0.0)),
        maillardPhaseSig: createSignal(new Phase(0, 0.0, 0.0)),
        developPhaseSig: createSignal(new Phase(0, 0.0, 0.0)),
        cursorLineXSig: createSignal(0),
        cursorTimestampSig: createSignal(0),
        cursorIndexSig: createSignal(0),
        toggleShowRorFilteredSig: createSignal(false),
        toggleShowRorOutlierSig: createSignal(false),
        ghostSig: createSignal(init_ghostSig()),
        currentTabIdSig: createSignal(0),
        phaseChartWidthSig: createSignal(360),
        titleSig: createSignal(""),
        countrySig: createSignal(""),
        processSig: createSignal(""),
        notesSig: createSignal(""),
        weightGreenSig: createSignal(0.0),
        weightRoastedSig: createSignal(0.0),
        volumeGreenSig: createSignal(0.0),
        volumeRoastedSig: createSignal(0.0),
        densityGreenSig: createSignal(0.0),
        densityRoastedSig: createSignal(0.0),
        moistureGreenSig: createSignal(0.0),
        moistureRoastedSig: createSignal(0.0),
        colorWholeSig: createSignal(0),
        colorGroundSig: createSignal(0),
        flavorListSig: createSignal(new Array<string>()),
        flavorWheelSig: createSignal(init_flavorWheel()),
        alarmsArrSig: createSignal(config.alarms.map((a: number) => { return { temperature: a, triggeredSig: createSignal(false) } })),
    }
}

export const appStateSig = createSignal(await init_appStateSig());

export function resetChannels() {
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
        channel.lastRorConvolveTimestampSig[SET](0);
        channel.lastRorConvolveValueSig[SET](-100);
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
    } as RoastEvents);

    appState().dryingPhaseSig[SET](new Phase(0, 0.0, 0.0));
    appState().maillardPhaseSig[SET](new Phase(0, 0.0, 0.0));
    appState().developPhaseSig[SET](new Phase(0, 0.0, 0.0));
    appState().cursorLineXSig[SET](0);
    appState().toggleShowRorFilteredSig[SET](false);
    appState().toggleShowRorOutlierSig[SET](false);
    appState().alarmsArrSig[GET]().forEach((alarm: any) => { alarm.triggeredSig[SET](false) });
    (document.getElementById("event_select") as HTMLSelectElement).value = "";

}

export function resetNotes() {
    const [appState, _setAppState] = appStateSig;

    appState().titleSig[SET]("");
    appState().countrySig[SET]("");
    appState().processSig[SET]("");
    appState().notesSig[SET]("");

    appState().weightGreenSig[SET](0.0);
    appState().weightRoastedSig[SET](0.0);
    appState().volumeGreenSig[SET](0.0);
    appState().volumeRoastedSig[SET](0.0);
    appState().densityGreenSig[SET](0.0);
    appState().densityRoastedSig[SET](0.0);
    appState().moistureGreenSig[SET](0.0);
    appState().moistureRoastedSig[SET](0.0);
    appState().colorWholeSig[SET](0);
    appState().colorGroundSig[SET](0);
    appState().flavorListSig[SET](new Array<string>());
    appState().flavorWheelSig[SET](init_flavorWheel());
}

export function resetGhost() {

    appStateSig[GET]().ghostSig[SET](init_ghostSig());

}

