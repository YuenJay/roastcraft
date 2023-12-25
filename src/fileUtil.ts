// SPDX-License-Identifier: GPL-3.0-or-later

import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { GET, SET, Point, appStateSig } from "./AppState";
import { calculatePhases, calculateRor, findRorOutlier } from './calculate';

export async function openFile() {
    const [appState, _setAppState] = appStateSig;

    try {
        let filepath = await open() as string;
        let content = await readTextFile(filepath);

        let loadObject = JSON.parse(content);

        appState().timerSig[SET](loadObject.timer);

        loadObject.channelArr.forEach((c: any) => {
            let channel = appState().channelArrSig[GET]().find((channel) => channel.id == c.id);
            if (channel) {
                c.dataArr.forEach((p: Point) => {
                    channel?.setDataArr([...channel.dataArr(), p]);
                });
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

export async function saveFile() {
    const [appState, _setAppState] = appStateSig;
    try {
        let filepath = await save() as string;
        if (!filepath) return;

        let saveObject = {
            timer: appState().timerSig[GET](),
            channelArr: new Array<any>(),
            roastEvents: appState().roastEventsSig[GET](),
        };

        appState().channelArrSig[GET]().forEach((channel) => {

            let saveDataArr = new Array<Point>();

            channel.dataArr().forEach((p) => {
                saveDataArr.push(p)
            });

            saveObject.channelArr.push({
                id: channel.id,
                dataArr: saveDataArr
            });
        });

        await writeTextFile(filepath, JSON.stringify(saveObject, null, 2));

    } catch (e) {
        console.log(e);
    }
}