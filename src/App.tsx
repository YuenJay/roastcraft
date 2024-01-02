// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, onCleanup, Show, For, Index } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { trace, attachConsole } from "tauri-plugin-log-api";
import { UnlistenFn, listen } from "@tauri-apps/api/event";

import MainChart from "./MainChart";
import RangeInput from "./RangeInput";
import { GET, SET, AppStatus, RoastEventId, Point, appStateSig, reset, RoastEvent } from "./AppState";
import WorkerFactory from "./WorkerFactory";
import timerWorker from "./timer.worker";
import { autoDetectChargeDrop, calculatePhases, calculateRor, findDryEnd, findRorOutlier, findTurningPoint, timestamp_format } from "./calculate";
import SecondaryChart from "./SecondaryChart";
import { openFile, saveFile } from "./fileUtil";
import PhaseChart from "./PhaseChart";
import PhaseTempChart from "./PhaseTempChart";

function App() {

    const [appState, _setAppState] = appStateSig;
    const [status, setStatus] = appState().statusSig;
    const [timer, setTimer] = appState().timerSig;
    const [channelArr, _setChannelArr] = appState().channelArrSig;
    const [logArr, setLogArr] = appState().logArrSig;
    const [roastEvents, setRoastEvents] = appState().roastEventsSig;
    const [manualChannelArr, _setManualChannelArr] = appState().manualChannelArrSig;
    const channelIdList = channelArr().map(m => m.id);

    let detach: UnlistenFn;
    let unlisten_reader: UnlistenFn;
    let unlisten_menu_event_listener: UnlistenFn;
    let timer_worker: Worker;

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
            calculateRor();
            findRorOutlier();
            autoDetectChargeDrop();
            findTurningPoint();
            findDryEnd();
            calculatePhases();

            // dump bt data to console
            let bt = channelArr()[appState().btIndex]
            console.log(bt.dataArr());
            console.log(bt.rorArrSig[GET]());
            console.log(bt.rorFilteredArrSig[GET]());
            console.log(bt.rorConvolveArrSig[GET]());

        });

        // event listener
        unlisten_menu_event_listener = await listen("menu_event", (event) => {
            switch (event.payload) {
                case "OPEN":
                    openFile();
                    break;

                case "SAVE":
                    saveFile();
                    break;

                default:
                    break;
            }
        });

        setLogArr([...logArr(), "RoastCraft is ready"]);

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

    async function buttonOnClicked() {

        // implicit reset data
        reset();

        await invoke("button_on_clicked");
        setStatus(AppStatus.ON);
        setLogArr([...logArr(), "start reading channels..."]);
    }

    async function buttonOffClicked() {
        await invoke("button_off_clicked");
        if (timer_worker) {
            timer_worker.terminate()
        };

        setStatus(AppStatus.OFF);

        setLogArr([...logArr(), "stopped reading channels"]);
    }

    async function buttonStartClicked() {
        timer_worker = new WorkerFactory(timerWorker) as Worker;
        timer_worker.postMessage(1000);
        timer_worker.onmessage = (event: any) => {
            setTimer(event.data);
        };

        setStatus(AppStatus.RECORDING);
        setLogArr([...logArr(), "start recording"]);
    }

    async function buttonResetClicked() {
        reset();
        setStatus(AppStatus.OFF);
    }


    function handleKeyDownEvent(event: KeyboardEvent) {
        trace("key down event: " + event.code);
        switch (event.code) {
            case 'KeyZ':
                handleCharge();
                break;
            case 'KeyX':
                handleDryEnd();
                break;
            case 'KeyC':
                handleFCStart();
                break;
            case 'KeyV':
                handleFCEnd();
                break;
            case 'KeyB':
                handleSCStart();
                break;
            case 'KeyN':
                handleSCEnd();
                break;
            case 'KeyM':
                handleDrop();
                break;
            default:

        }
    }

    async function handleCharge() {
        setRoastEvents({ ...roastEvents(), CHARGE: new RoastEvent(RoastEventId.CHARGE, timer(), channelArr()[appState().btIndex].currentDataSig[GET]()) });
        appState().timeDeltaSig[SET](- timer());
    }

    async function handleDryEnd() {
        setRoastEvents({ ...roastEvents(), DRY_END: new RoastEvent(RoastEventId.DRY_END, timer(), channelArr()[appState().btIndex].currentDataSig[GET]()) });
    }

    async function handleFCStart() {
        setRoastEvents({ ...roastEvents(), FC_START: new RoastEvent(RoastEventId.FC_START, timer(), channelArr()[appState().btIndex].currentDataSig[GET]()) });
    }

    async function handleFCEnd() {
        setRoastEvents({ ...roastEvents(), FC_END: new RoastEvent(RoastEventId.FC_END, timer(), channelArr()[appState().btIndex].currentDataSig[GET]()) });
    }

    async function handleSCStart() {
        setRoastEvents({ ...roastEvents(), SC_START: new RoastEvent(RoastEventId.SC_START, timer(), channelArr()[appState().btIndex].currentDataSig[GET]()) });
    }

    async function handleSCEnd() {
        setRoastEvents({ ...roastEvents(), SC_END: new RoastEvent(RoastEventId.SC_END, timer(), channelArr()[appState().btIndex].currentDataSig[GET]()) });
    }

    async function handleDrop() {
        setRoastEvents({ ...roastEvents(), DROP: new RoastEvent(RoastEventId.DROP, timer(), channelArr()[appState().btIndex].currentDataSig[GET]()) });
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

            {/* side bar start*/}
            <div class="sidebar h-full relative pl-2.5">
                {/* resizer */}
                <div class="resizer h-full absolute cursor-col-resize w-1.5 top-0 left-0 bg-gray-200"></div>

                {/* scrollable start*/}
                <div class="h-full overflow-y-auto pr-1 flex flex-col gap-y-1">
                    {/* timer and on/off buttons */}
                    <div class="flex flex-wrap gap-1">
                        <div class="flex items-center justify-center bg-black text-white rounded text-4xl font-extrabold w-28 ">
                            {timestamp_format(timer() + appState().timeDeltaSig[GET]())}
                        </div>
                        <Show when={status() == AppStatus.OFF}>
                            <button class="ml-auto btn btn-accent rounded relative w-20" onClick={buttonResetClicked}>RESET
                                <span class="absolute bottom-0 right-0 mr-1 underline text-xs">R</span>
                            </button>

                            <button class="btn btn-accent rounded relative w-20" onClick={buttonOnClicked}>ON
                                <span class="absolute bottom-0 right-0 mr-1 underline text-xs">Q</span>
                            </button>
                        </Show>
                        <Show when={status() == AppStatus.ON}>
                            <button class="ml-auto btn btn-accent rounded relative w-20" onClick={buttonOffClicked}>OFF
                                <span class="absolute bottom-0 right-0 mr-1 underline text-xs">Q</span>
                            </button>

                            <button class="btn btn-accent rounded relative w-20" onClick={buttonStartClicked}>START
                                <span class="absolute bottom-0 right-0 mr-1 underline text-xs1">W</span>
                            </button>
                        </Show>
                        <Show when={status() == AppStatus.RECORDING}>
                            <button class="ml-auto btn btn-accent rounded relative w-20" onClick={buttonOffClicked}>OFF
                                <span class="absolute bottom-0 right-0 mr-1 underline text-xs">Q</span>
                            </button>
                        </Show>

                    </div>
                    {/* channels */}
                    <div class="flex flex-wrap gap-1">
                        {/* BT */}
                        <div class="bg-base-300 rounded text-right w-20 px-1 ">
                            <p>{channelArr()[appState().btIndex].id}</p>
                            <p class="text-2xl leading-tight text-red-600">
                                {channelArr()[appState().btIndex].currentDataSig[GET]().toFixed(1)}
                            </p>
                        </div>

                        <div class="bg-base-300 rounded text-right w-20 px-1">
                            <p >Δ BT</p>
                            <p class="text-2xl leading-tight text-blue-600">
                                {channelArr()[appState().btIndex].currentRorSig[GET]().toFixed(1)}
                            </p>
                        </div>

                        <Index each={channelIdList}>
                            {
                                (_item, index) => (
                                    <Show when={index != appState().btIndex}>
                                        <div class="bg-base-300 rounded text-right w-20 px-1">
                                            <p>{channelArr()[index].id}</p>
                                            <p class="text-2xl leading-tight text-red-600">
                                                {channelArr()[index].currentDataSig[GET]().toFixed(1)}
                                            </p>
                                        </div>
                                    </Show>
                                )
                            }
                        </Index>
                    </div>

                    <PhaseChart></PhaseChart>
                    <PhaseTempChart></PhaseTempChart>

                    {/* event buttons */}
                    <div class="flex flex-wrap gap-1">

                        <button class={`relative btn btn-primary rounded w-20 ${roastEvents().CHARGE != undefined ? "btn-disabled" : ""}`}
                            onClick={handleCharge}>
                            CHARGE
                            <span class="absolute bottom-0 right-0 mr-1 underline text-xs">Z</span>
                        </button>

                        <button class={`relative btn btn-primary rounded w-20 ${roastEvents().DRY_END != undefined ? "btn-disabled" : ""}`}
                            onClick={handleDryEnd}>
                            DRY END
                            <span class="absolute bottom-0 right-0 mr-1 underline text-xs">X</span>
                        </button>

                        <button class={`relative btn btn-primary rounded w-20 ${roastEvents().FC_START != undefined ? "btn-disabled" : ""}`}
                            onClick={handleFCStart}>
                            FC START
                            <span class="absolute bottom-0 right-0 mr-1 underline text-xs">C</span>
                        </button>

                        <button class={`relative btn btn-primary rounded w-20 ${roastEvents().FC_END != undefined ? "btn-disabled" : ""}`}
                            onClick={handleFCEnd}>
                            FC END
                            <span class="absolute bottom-0 right-0 mr-1 underline text-xs">V</span>
                        </button>

                        <button class={`relative btn btn-primary rounded w-20 ${roastEvents().SC_START != undefined ? "btn-disabled" : ""}`}
                            onClick={handleSCStart}>
                            SC START
                            <span class="absolute bottom-0 right-0 mr-1 underline text-xs">B</span>
                        </button>

                        <button class={`relative btn btn-primary rounded w-20 ${roastEvents().SC_END != undefined ? "btn-disabled" : ""}`}
                            onClick={handleSCEnd}>
                            SC END
                            <span class="absolute bottom-0 right-0 mr-1 underline text-xs">N</span>
                        </button>

                        <button class={`relative btn btn-primary rounded w-20 ${roastEvents().DROP != undefined ? "btn-disabled" : ""}`}
                            onClick={handleDrop}>
                            DROP
                            <span class="absolute bottom-0 right-0 mr-1 underline text-xs">M</span>
                        </button>

                    </div>

                    <For each={manualChannelArr()}>
                        {(mc) => (
                            <RangeInput channel_id={mc.id}></RangeInput>
                        )}
                    </For>

                    <div class="flex flex-wrap">
                        <label class="label cursor-pointer basis-1/3">
                            <span class="label-text mr-1">ROR filtered</span>
                            <input type="checkbox" class="toggle toggle-sm toggle-primary" onChange={(e) => {
                                appState().toggleShowRorFilteredSig[SET](Boolean(e.currentTarget.checked));
                            }} />
                        </label>
                        <label class="label cursor-pointer basis-1/3">
                            <span class="label-text mr-1">ROR outlier</span>
                            <input type="checkbox" class="toggle toggle-sm toggle-primary" onChange={(e) => {
                                appState().toggleShowRorOutlierSig[SET](Boolean(e.currentTarget.checked));
                            }} />
                        </label>
                        <label class="label cursor-pointer basis-1/3">
                            <span class="label-text mr-1">ROR regression</span>
                            <input type="checkbox" class="toggle toggle-sm toggle-primary" onChange={(e) => {
                                appState().toggleShowRorRegressionSig[SET](Boolean(e.currentTarget.checked));
                            }} />
                        </label>
                        {/* <label class="label">
                        <span class="label-text ml-auto mr-2">ROR zscore</span>
                        <input type="number" id="zscore" name="zscore" min="2" max="4" step="0.1" value="3" class="input input-bordered input-sm" />
                    </label> */}

                    </div>
                    <Show when={logArr().length > 0}>

                        <div class="text-sm">
                            {/* show 5 lines of logArr, newest on top */}
                            <For each={logArr().slice(-5).reverse()}>
                                {(item) => <p class="px-1 border-b first:bg-base-200">{item.toString()}</p>}
                            </For>

                        </div>
                    </Show>
                </div>
                {/* scrollable end*/}
            </div>
            {/* side bar end*/}
        </div>
    );
}

export default App;
