// SPDX-License-Identifier: GPL-3.0-or-later

import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { GET, SET, Point, appStateSig, Channel, Ghost, GhostChannel } from "./AppState";
import { calculatePhases, calculateRor, findRorOutlier } from './calculate';

export async function openFile() {
    const [appState, _setAppState] = appStateSig;

    try {
        let filepath = await open() as string;
        let content = await readTextFile(filepath);

        let loadObject = JSON.parse(content);

        // use BT last Point as timer and currentData
        let bt = loadObject.channelArr.find((c: any) => c.id == "BT");
        let lastBTPoint = bt.dataArr[bt.dataArr.length - 1];
        appState().timerSig[SET](lastBTPoint.timestamp);
        appState().channelArrSig[GET]()[appState().btIndex].currentDataSig[SET](lastBTPoint.value);

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

        calculateRor();
        findRorOutlier();
        calculatePhases();
    } catch (e) {
        console.log(e);
    }
}

export async function openFileAsGhost() {
    const [appState, _setAppState] = appStateSig;
    const [ghost, setGhost] = appState().ghostSig;

    try {
        let filepath = await open() as string;
        let content = await readTextFile(filepath);

        let loadObject = JSON.parse(content);

        let timeDelta = 0;
        if (loadObject.roastEvents.CHARGE != undefined) {
            timeDelta = - loadObject.roastEvents.CHARGE.timestamp;
        }

        let channelArr = new Array<GhostChannel>;

        loadObject.channelArr.forEach((c: any) => {
            let channel = appState().channelArrSig[GET]().find((channel) => channel.id == c.id);
            if (channel) {
                channelArr.push(new GhostChannel(c.id, c.dataArr))
            }
        });

        setGhost(new Ghost(timeDelta, channelArr));

        console.log(ghost());

    } catch (e) {
        console.log(e);
    }
}

export async function saveFile() {
    const [appState, _setAppState] = appStateSig;
    try {
        let filepath = await save() as string;
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