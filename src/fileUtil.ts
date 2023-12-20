import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { GET, SET, AppStatus, EventId, Point, RoastPhase, appStateSig } from "./AppState";

export async function openFile() {
    const [appState, _setAppState] = appStateSig;

    try {
        let filepath = await open() as string;
        let content = await readTextFile(filepath);

        let loadObject = JSON.parse(content);
        loadObject.channelArr.forEach((c: any) => {
            let channel = appState().channelArrSig[GET]().find((channel) => channel.id == c.id);
            if (channel) {
                c.data.forEach((p: Point) => {
                    channel?.setData([...channel.data(), p]);
                });
            }
        });
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
            channelArr: new Array<any>()
        };

        appState().channelArrSig[GET]().forEach((channel) => {

            let saveData = new Array<Point>();

            channel.data().forEach((p) => {
                saveData.push(p)
            });

            saveObject.channelArr.push({
                id: channel.id,
                data: saveData
            });
        });

        await writeTextFile(filepath, JSON.stringify(saveObject, null, 2));

    } catch (e) {
        console.log(e);
    }
}