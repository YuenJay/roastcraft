import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { GET, SET, AppStatus, EventId, Point, RoastPhase, appStateSig } from "./AppState";

export async function openFile() {
    try {
        let filepath = await open() as string;
        let content = await readTextFile(filepath);

    } catch (e) {
        console.log(e);
    }
}

export async function saveFile() {
    const [appState, setAppState] = appStateSig;
    try {
        let filepath = await save() as string;
        if (!filepath) return;

        let save_object = {
            channelList: new Array<any>()
        };

        appState().channelListSig[GET]().forEach((c) => {

            let data = new Array<Point>();

            c.data().forEach((p) => {
                data.push(p)
            });

            save_object.channelList.push({
                id: c.id,
                data: data
            });
        });

        await writeTextFile(filepath, JSON.stringify(save_object, null, 2));

    } catch (e) {
        console.log(e);
    }
}