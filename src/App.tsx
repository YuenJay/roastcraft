// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, onCleanup, For } from "solid-js";
import { trace, attachConsole } from "tauri-plugin-log-api";
import { UnlistenFn, listen } from "@tauri-apps/api/event";

import MainChart from "./MainChart";
import { GET, SET, BT, AppStatus, Point, appStateSig, Channel, resetGhost } from "./AppState";
import { autoDetectChargeDrop, calculatePhases, calculateRor, findDryEnd, findROR_TP, findRorOutlier, findTurningPoint } from "./calculate";
import SecondaryChart from "./SecondaryChart";
import { openFile, loadGhost, saveFile } from "./fileUtil";
import DashboardPanel from "./DashboardPanel";
import NotesPanel from "./NotesPanel";
import SettingsPanel from "./SettingsPanel";

function App() {

    const [appState, _setAppState] = appStateSig;
    const [status, _setStatus] = appState().statusSig;
    const [timer, _setTimer] = appState().timerSig;
    const [channelArr, _setChannelArr] = appState().channelArrSig;
    const [logArr, setLogArr] = appState().logArrSig;
    const [roastEvents, _setRoastEvents] = appState().roastEventsSig;
    const [manualChannelArr, _setManualChannelArr] = appState().manualChannelArrSig;
    const [currentTabId, setCurrentTabId] = appState().currentTabIdSig;
    const channelIdList = channelArr().map(m => m.id);
    const bt = channelArr().find(c => c.id == BT) as Channel;

    let detach: UnlistenFn;
    let unlisten_reader: UnlistenFn;
    let unlisten_menu_event_listener: UnlistenFn;

    onMount(async () => {

        // tauri-plugin-log-api
        // with LogTarget::Webview enabled this function will print logArr to the browser console
        detach = await attachConsole();

        // event listener
        unlisten_reader = await listen("read_channels", (event: any) => {
            trace("event \"read_channels\" catched :" + JSON.stringify(event.payload));

            // update current channels and ror
            let i;
            for (i = 0; i < channelIdList.length; i++) {

                channelArr()[i].currentDataSig[SET](Number(event.payload[channelIdList[i]]));

                /* calculate ROR start */
                channelArr()[i].dataWindowArr.push(
                    {
                        value: Number(event.payload[channelIdList[i]]),
                        system_time: new Date().getTime()
                    }
                );

                // buffer size of 5
                if (channelArr()[i].dataWindowArr.length > 5) {
                    channelArr()[i].dataWindowArr.shift();
                }

                let delta = channelArr()[i].dataWindowArr[channelArr()[i].dataWindowArr.length - 1].value
                    - channelArr()[i].dataWindowArr[0].value;
                let time_elapsed_sec = (channelArr()[i].dataWindowArr[channelArr()[i].dataWindowArr.length - 1].system_time
                    - channelArr()[i].dataWindowArr[0].system_time)
                    / 1000;

                channelArr()[i].currentRorSig[SET](
                    (Math.floor(delta / time_elapsed_sec * 60 * 10)) / 10 || 0
                );
                /* calculate ROR end */

                // write into history data
                if (status() == AppStatus.RECORDING) {
                    channelArr()[i].setDataArr(
                        [...channelArr()[i].dataArr(), new Point(timer(), event.payload[channelIdList[i]])]
                    )
                }
            }

            // BT only for now
            calculateRor(bt, roastEvents());
            findRorOutlier(bt);
            findROR_TP(bt);

            autoDetectChargeDrop();
            findTurningPoint();
            findDryEnd();
            calculatePhases(timer(), bt.currentDataSig[GET]());

            // dump bt data to console
            // console.log(bt.dataArr());
            // console.log(bt.rorArrSig[GET]());
            // console.log(bt.rorFilteredArrSig[GET]());
            // console.log(bt.rorConvolveArrSig[GET]());

        });

        // event listener
        unlisten_menu_event_listener = await listen("menu_event", (event) => {
            switch (event.payload) {
                case "OPEN_FILE":
                    openFile();
                    break;
                case "SAVE_FILE":
                    saveFile();
                    break;
                case "LOAD_GHOST":
                    loadGhost();
                    break;
                case "RESET_GHOST":
                    resetGhost();
                    break;
                default:
                    break;
            }
        });

        setLogArr([...logArr(), "RoastCraft is ready"]);

        window.speechSynthesis.onvoiceschanged = function () {
            // window.speechSynthesis.speak(new SpeechSynthesisUtterance("歡迎使用roastcraft"));
            if (window.speechSynthesis.getVoices().length > 0) {
                setLogArr([...logArr(), "default voice : " + window.speechSynthesis.getVoices().find((v) => v.default == true)?.name]);
            }
        };

        // alternative: https://tauri.app/v1/api/js/globalshortcut/
        // but I think this is ok
        document.addEventListener("keydown", handleKeyDownEvent);

        let resizer = document.querySelector(".resizer");
        let sidebar = document.querySelector(".sidebar");

        function initResizerFn(resizer: any, sidebar: any) {

            // track current mouse position in x var
            let x: number, w: number;

            function rs_mousedownHandler(e: any) {

                x = e.clientX;

                var sbWidth = window.getComputedStyle(sidebar as Element).width;
                w = parseInt(sbWidth, 10);

                document.addEventListener("mousemove", rs_mousemoveHandler);
                document.addEventListener("mouseup", rs_mouseupHandler);
            }

            function rs_mousemoveHandler(e: any) {
                var dx = e.clientX - x;

                var cw = w - dx; // complete width

                if (cw < 768) {
                    sidebar.style.width = `${cw}px`;
                }
            }

            function rs_mouseupHandler() {
                // remove event mousemove && mouseup
                document.removeEventListener("mouseup", rs_mouseupHandler);
                document.removeEventListener("mousemove", rs_mousemoveHandler);
            }

            resizer.addEventListener("mousedown", rs_mousedownHandler);
        }

        initResizerFn(resizer, sidebar);
    });

    onCleanup(() => {
        detach();
        unlisten_reader();
        unlisten_menu_event_listener();
    })

    function handleKeyDownEvent(event: KeyboardEvent) {
        console.log("key down event: " + event.code);
        switch (event.code) {
            case 'KeyZ':
                // handleCharge();
                break;
            case 'KeyX':
                // handleDryEnd();
                break;
            case 'KeyC':
                // handleFCStart();
                break;
            case 'KeyV':
                // handleFCEnd();
                break;
            case 'KeyB':
                // handleSCStart();
                break;
            case 'KeyN':
                // handleSCEnd();
                break;
            case 'KeyM':
                // handleDrop();
                break;
            default:

        }
    }

    return (
        <div class="w-full h-screen flex select-none pt-1 overflow-y-hidden">

            {/* main start*/}
            <div class="grow overflow-y-auto pr-1">

                <MainChart />

                <For each={manualChannelArr()}>
                    {(mc) => (
                        <SecondaryChart channel_id={mc.id} />
                    )}
                </For>

            </div>
            {/* main end*/}

            {/* side panel start*/}
            <div class="sidebar h-full relative pl-2.5">
                {/* resizer */}
                <div class="resizer h-full absolute cursor-col-resize w-1.5 top-0 left-0 bg-gray-200"></div>

                {/* scrollable start*/}
                <div class="h-full overflow-y-auto pr-1 flex flex-col gap-y-1">

                    <div role="tablist" class="tabs tabs-bordered">
                        <a role="tab" class={`tab ${currentTabId() == 0 ? "tab-active" : ""}`} onClick={() => {
                            setCurrentTabId(0);
                            document.addEventListener("keydown", handleKeyDownEvent);
                        }}>Dashboard</a>
                        <a role="tab" class={`tab ${currentTabId() == 1 ? "tab-active" : ""}`}
                            onClick={() => {
                                setCurrentTabId(1);
                                // hoykey is disabled in Notes panel
                                document.removeEventListener("keydown", handleKeyDownEvent);
                            }}>
                            Notes
                        </a>
                        <a role="tab" class={`tab ${currentTabId() == 2 ? "tab-active" : ""}`} onClick={() => {
                            setCurrentTabId(2);
                            document.addEventListener("keydown", handleKeyDownEvent);
                        }}>Settings</a>
                    </div>

                    <div class={`flex flex-col gap-y-1 ${currentTabId() == 0 ? "" : "hidden"}`}>
                        <DashboardPanel></DashboardPanel>
                    </div>
                    <div class={`flex flex-col gap-y-1 ${currentTabId() == 1 ? "" : "hidden"}`}>
                        <NotesPanel></NotesPanel>
                    </div>
                    <div class={`flex flex-col gap-y-1 ${currentTabId() == 2 ? "" : "hidden"}`}>
                        <SettingsPanel></SettingsPanel>
                    </div>

                </div>
                {/* scrollable end*/}
            </div>
            {/* side panel end*/}
        </div>
    );
}

export default App;
