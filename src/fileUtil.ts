// SPDX-License-Identifier: GPL-3.0-or-later

import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { GET, SET, Point, appStateSig, Channel, Ghost, GhostChannel, BT } from "./AppState";
import { calculatePhases, calculateRor, findROR_TP, findRorOutlier } from './calculate';
import { createSignal } from 'solid-js';

export async function openFile() {
    const [appState, _setAppState] = appStateSig;
    const [channelArr, _setChannelArr] = appState().channelArrSig;
    const [roastEvents, _setRoastEvents] = appState().roastEventsSig;
    const [_dryingPhase, setDryingPhase] = appState().dryingPhaseSig;
    const [_maillardPhase, setMaillardPhase] = appState().maillardPhaseSig;
    const [_developPhase, setDevelopPhase] = appState().developPhaseSig;
    const bt = channelArr().find(c => c.id == BT) as Channel;

    try {
        let filepath = await open({
            filters: [{
                name: 'Profile',
                extensions: ['json']
            }]
        }) as string;
        let content = await readTextFile(filepath);

        let loadObject = JSON.parse(content);

        loadObject.channelArr.forEach((c: any) => {
            let channel = appState().channelArrSig[GET]().find((channel) => channel.id == c.id);
            if (channel) {
                c.dataArr.forEach((p: Point) => {
                    channel?.setDataArr([...channel.dataArr(), p]);
                });
            }
        });

        loadObject.manualChannelArr.forEach((mc: any) => {
            let channel = appState().manualChannelArrSig[GET]().find((channel) => channel.id == mc.id);
            if (channel) {
                channel?.setDataArr(new Array<Point>());
                mc.dataArr.forEach((p: Point) => {
                    channel?.setDataArr([...channel.dataArr(), p]);
                });
                channel?.currentDataSig[SET](mc.dataArr[mc.dataArr.length - 1].value);
            }
        });

        appState().roastEventsSig[SET](loadObject.roastEvents);

        let chargeEvent = appState().roastEventsSig[GET]().CHARGE;

        if (chargeEvent != undefined) {
            appState().timeDeltaSig[SET](- chargeEvent.timestamp);
        }

        calculateRor(bt, roastEvents());
        findRorOutlier(bt);
        findROR_TP(bt);

        // use BT last Point as timer and currentData
        let btLoaded = loadObject.channelArr.find((c: any) => c.id == "BT");
        let lastBTPoint = btLoaded.dataArr[btLoaded.dataArr.length - 1];
        appState().timerSig[SET](lastBTPoint.timestamp);

        let result = calculatePhases(lastBTPoint.timestamp, lastBTPoint.value, roastEvents());
        setDryingPhase(result.dry);
        setMaillardPhase(result.mai);
        setDevelopPhase(result.dev);

    } catch (e) {
        console.log(e);
    }
}

export async function loadGhost() {
    const [appState, _setAppState] = appStateSig;
    const [ghost, setGhost] = appState().ghostSig;

    try {
        let filepath = await open({
            filters: [{
                name: 'Profile',
                extensions: ['json']
            }]
        }) as string;
        let content = await readTextFile(filepath);

        let loadObject = JSON.parse(content);

        // use BT last Point as timer and currentData
        let btLoaded = loadObject.channelArr.find((c: any) => c.id == "BT");
        let lastBTPoint = btLoaded.dataArr[btLoaded.dataArr.length - 1];

        let timeDelta = 0;
        let channelArr = new Array<GhostChannel>;
        let roastEvents = loadObject.roastEvents;

        loadObject.channelArr.forEach((c: any) => {
            let channel = appState().channelArrSig[GET]().find((channel) => channel.id == c.id);
            if (channel) {

                let tempChannel = new Channel(
                    channel.id,            // id
                    channel.label,         // label 
                    channel.unit,          // unit
                    channel.color,         // color
                    channel.rorColor,      // ror_color
                    createSignal(0), //currentDataSig
                    createSignal(0), //currentRorSig
                    [], //data_window
                    createSignal(new Array<Point>()), // dataSig
                    createSignal(new Array<Point>()), // rorSig
                    createSignal(new Array<Point>()), // rorOutlierSig
                    createSignal(new Array<Point>()), // rorFilteredSig
                    createSignal(new Array<Point>()), // rorConvolveSig
                );
                tempChannel.setDataArr(c.dataArr);
                calculateRor(tempChannel, roastEvents);
                findRorOutlier(tempChannel);

                channelArr.push(new GhostChannel(
                    channel.id,
                    channel.color,
                    channel.rorColor,
                    c.dataArr,
                    tempChannel.rorConvolveArrSig[GET]()));
            }
        });

        if (roastEvents != undefined && roastEvents.CHARGE != undefined) {
            timeDelta = - roastEvents.CHARGE.timestamp;
        }

        let manualChannelArr = loadObject.manualChannelArr;
        manualChannelArr.forEach((mc: any) => {
            mc.dataArr = [...mc.dataArr, { timestamp: lastBTPoint.timestamp, value: mc.dataArr[mc.dataArr.length - 1].value }]
        });

        let g = new Ghost(timeDelta, channelArr, manualChannelArr, roastEvents);

        let result = calculatePhases(lastBTPoint.timestamp, lastBTPoint.value, roastEvents);
        g.dryingPhase = result.dry;
        g.maillardPhase = result.mai;
        g.developPhase = result.dev;

        setGhost(g);
        appState().isGhostLoadedSig[SET](true);

        console.log(ghost());

    } catch (e) {
        console.log(e);
    }
}

function getCurrentFormattedTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    const formattedTime = `${year}_${month}_${day}_${hours}${minutes}`;
    return formattedTime;
}

export async function saveFile() {
    const [appState, _setAppState] = appStateSig;
    try {

        let filepath = await save({
            defaultPath: getCurrentFormattedTime() + ".json",
            filters: [{
                name: 'Profile',
                extensions: ['json']
            }]
        }) as string;
        if (!filepath) return;

        let saveObject = {
            channelArr: new Array<any>(),
            manualChannelArr: new Array<any>(),
            roastEvents: appState().roastEventsSig[GET](),
        };

        appState().channelArrSig[GET]().forEach((c) => {

            let saveDataArr = new Array<Point>();

            c.dataArr().forEach((p) => {
                saveDataArr.push(p)
            });

            saveObject.channelArr.push({
                id: c.id,
                dataArr: saveDataArr
            });
        });

        appState().manualChannelArrSig[GET]().forEach((mc) => {

            let saveDataArr = new Array<Point>();

            mc.dataArr().forEach((p) => {
                saveDataArr.push(p)
            });

            saveObject.manualChannelArr.push({
                id: mc.id,
                dataArr: saveDataArr
            });
        });

        await writeTextFile(filepath, JSON.stringify(saveObject, null, 2));

    } catch (e) {
        console.log(e);
    }
}