// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, onCleanup, Show, For, Index } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { trace, attachConsole } from "tauri-plugin-log-api";
import { UnlistenFn, listen } from "@tauri-apps/api/event";

import MainChart from "./MainChart";
import BarChart from "./BarChart";
import ManualChart from "./ManualChart";
import { GET, SET, AppStatus, RoastEventId, Point, appStateSig, reset, RoastEvent } from "./AppState";
import WorkerFactory from "./WorkerFactory";
import timerWorker from "./timer.worker";
import { autoDetectChargeDrop, calculatePhases, calculateRor, findDryEnd, findRorOutlier, findTurningPoint, timestamp_format } from "./calculate";
import SecondaryChart from "./SecondaryChart";
import { openFile, saveFile } from "./fileUtil";

function App() {

    const [appState, _setAppState] = appStateSig;
    const [status, setStatus] = appState().statusSig;
    const [timer, setTimer] = appState().timerSig;
    const [channelArr, _setChannelArr] = appState().channelArrSig;
    const [logArr, setLogArr] = appState().logArrSig;
    const [roastEvents, setRoastEvents] = appState().roastEventsSig;
    const [dryingPhase, _setDryingPhase] = appState().dryingPhaseSig;
    const [maillardPhase, _setMaillardPhase] = appState().maillardPhaseSig;
    const [developPhase, _setDevelopPhase] = appState().developPhaseSig;
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
        <div class="grid grid-cols-12 m-1">

            {/* main start*/}
            <div class="col-span-9 ">

                <MainChart />

                <SecondaryChart />

            </div>
            {/* main end*/}

            {/* side bar start*/}
            <div class="col-span-3 ">
                <div class="flex flex-col gap-1">
                    <div class="flex flex-row gap-1">
                        <div class="bg-black rounded py-1 px-2 basis-2/5">
                            <p class="text-4xl font-extrabold text-white text-center">
                                {timestamp_format(timer() + appState().timeDeltaSig[GET]())}
                            </p>
                        </div>
                        <Show when={status() == AppStatus.OFF}>
                            <button class="ml-auto btn btn-accent rounded relative basis-1/5" onClick={buttonResetClicked}>RESET
                                <span class="absolute bottom-0 right-0 mr-1 underline text-xs">R</span>
                            </button>

                            <button class="btn btn-accent rounded relative basis-1/5" onClick={buttonOnClicked}>ON
                                <span class="absolute bottom-0 right-0 mr-1 underline text-xs">Q</span>
                            </button>
                        </Show>
                        <Show when={status() == AppStatus.ON}>
                            <button class="ml-auto btn btn-accent rounded relative basis-1/5" onClick={buttonOffClicked}>OFF
                                <span class="absolute bottom-0 right-0 mr-1 underline text-xs">Q</span>
                            </button>

                            <button class="btn btn-accent rounded relative basis-1/5" onClick={buttonStartClicked}>START
                                <span class="absolute bottom-0 right-0 mr-1 underline text-xs1">W</span>
                            </button>
                        </Show>
                        <Show when={status() == AppStatus.RECORDING}>
                            <button class="ml-auto btn btn-accent rounded relative basis-1/5" onClick={buttonOffClicked}>OFF
                                <span class="absolute bottom-0 right-0 mr-1 underline text-xs">Q</span>
                            </button>
                        </Show>
                    </div>

                    <div class="flex flex-row gap-1">
                        {/* BT */}
                        <div class="bg-base-300 rounded text-right basis-1/5 p-1 ">
                            <p>{channelArr()[appState().btIndex].id}</p>
                            <p class="text-2xl font-medium text-red-600">
                                {channelArr()[appState().btIndex].currentDataSig[GET]().toFixed(1)}
                            </p>
                        </div>

                        <div class="bg-base-300 rounded text-right basis-1/5 p-1">
                            <p>Δ BT</p>
                            <p class="text-2xl font-medium text-blue-600">
                                {channelArr()[appState().btIndex].currentRorSig[GET]().toFixed(1)}
                            </p>
                        </div>

                        <Index each={channelIdList}>
                            {
                                (_item, index) => (
                                    <Show when={index != appState().btIndex}>
                                        <div class="bg-base-300 rounded text-right basis-1/5 p-1">
                                            <p>{channelArr()[index].id}</p>
                                            <p class="text-2xl font-medium text-red-600">
                                                {channelArr()[index].currentDataSig[GET]().toFixed(1)}
                                            </p>
                                        </div>
                                    </Show>
                                )
                            }
                        </Index>
                    </div>
                    <div class="flex flex-row gap-1">
                        <div class="bg-base-300 rounded w-24 p-1">
                            <p class="text-right">Drying</p>
                            <div class="grid grid-cols-2" >
                                <p class="text-sm font-medium text-blue-600">
                                    {timestamp_format(dryingPhase().time)}
                                </p>
                                <p class="text-right text-sm font-medium text-orange-600">
                                    {dryingPhase().temp_rise.toFixed(1)}°
                                </p>
                                <p class="text-sm font-medium text-blue-600">
                                    {dryingPhase().percent.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div class="bg-base-300 rounded w-24 p-1">
                            <p class="text-right">Maillard</p>
                            <div class="grid grid-cols-2" >
                                <p class="text-sm font-medium text-blue-600">
                                    {timestamp_format(maillardPhase().time)}
                                </p>
                                <p class="text-right text-sm font-medium text-orange-600">
                                    {maillardPhase().temp_rise.toFixed(1)}°
                                </p>
                                <p class="text-sm font-medium text-blue-600">
                                    {maillardPhase().percent.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div class="bg-base-300 rounded w-24 p-1">
                            <p class="text-right">Develop</p>
                            <div class="grid grid-cols-2" >
                                <p class="text-sm font-medium text-blue-600">
                                    {timestamp_format(developPhase().time)}
                                </p>
                                <p class="text-right text-sm font-medium text-orange-600">
                                    {developPhase().temp_rise.toFixed(1)}°
                                </p>
                                <p class="text-sm font-medium text-blue-600">
                                    {developPhase().percent.toFixed(1)}%
                                </p>

                            </div>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-3" >
                    <BarChart
                        title="Drying"
                        data={[
                            // { id: "Ref", opacity: 0.5, percent: 40.2, temp_rise: 57.2 },
                            { id: "#", opacity: 1, phase: dryingPhase },
                        ]} />
                    <BarChart
                        title="Maillard"
                        data={[
                            // { id: "Ref", opacity: 0.5, percent: 40.3, temp_rise: 44.8 },
                            { id: "#", opacity: 1, phase: maillardPhase },
                        ]} />
                    <BarChart
                        title="Develop"
                        data={[
                            // { id: "Ref", opacity: 0.5, percent: 19.5, temp_rise: 13.0 },
                            { id: "#", opacity: 1, phase: developPhase },
                        ]} />
                </div>
                <div class="flex flex-wrap gap-1 ">

                    <button class={`relative btn btn-primary rounded basis-auto ${roastEvents().CHARGE != undefined ? "btn-disabled" : ""}`}
                        onClick={handleCharge}>
                        CHARGE
                        <span class="absolute bottom-0 right-0 mr-1 underline text-xs">Z</span>
                    </button>

                    <button class={`relative btn btn-primary rounded basis-auto ${roastEvents().DRY_END != undefined ? "btn-disabled" : ""}`}
                        onClick={handleDryEnd}>
                        DRY END
                        <span class="absolute bottom-0 right-0 mr-1 underline text-xs">X</span>
                    </button>

                    <button class={`relative btn btn-primary rounded basis-auto ${roastEvents().FC_START != undefined ? "btn-disabled" : ""}`}
                        onClick={handleFCStart}>
                        FC START
                        <span class="absolute bottom-0 right-0 mr-1 underline text-xs">C</span>
                    </button>

                    <button class={`relative btn btn-primary rounded basis-auto ${roastEvents().FC_END != undefined ? "btn-disabled" : ""}`}
                        onClick={handleFCEnd}>
                        FC END
                        <span class="absolute bottom-0 right-0 mr-1 underline text-xs">V</span>
                    </button>

                    <button class={`relative btn btn-primary rounded basis-auto ${roastEvents().SC_START != undefined ? "btn-disabled" : ""}`}
                        onClick={handleSCStart}>
                        SC START
                        <span class="absolute bottom-0 right-0 mr-1 underline text-xs">B</span>
                    </button>

                    <button class={`relative btn btn-primary rounded basis-auto ${roastEvents().SC_END != undefined ? "btn-disabled" : ""}`}
                        onClick={handleSCEnd}>
                        SC END
                        <span class="absolute bottom-0 right-0 mr-1 underline text-xs">N</span>
                    </button>

                    <button class={`relative btn btn-primary rounded basis-auto ${roastEvents().DROP != undefined ? "btn-disabled" : ""}`}
                        onClick={handleDrop}>
                        DROP
                        <span class="absolute bottom-0 right-0 mr-1 underline text-xs">M</span>
                    </button>

                </div>

                <ManualChart></ManualChart>
                <ManualChart></ManualChart>

                <div class="flex flex-wrap">
                    <label class="label cursor-pointer basis-1/3">
                        <span class="label-text mr-1">ROR filtered</span>
                        <input type="checkbox" class="toggle toggle-sm" onChange={(e) => {
                            appState().toggleShowRorFilteredSig[SET](Boolean(e.currentTarget.checked));
                        }} />
                    </label>
                    <label class="label cursor-pointer basis-1/3">
                        <span class="label-text mr-1">ROR outlier</span>
                        <input type="checkbox" class="toggle toggle-sm" onChange={(e) => {
                            appState().toggleShowRorOutlierSig[SET](Boolean(e.currentTarget.checked));
                        }} />
                    </label>
                    <label class="label cursor-pointer basis-1/3">
                        <span class="label-text mr-1">ROR regression</span>
                        <input type="checkbox" class="toggle toggle-sm" onChange={(e) => {
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
            {/* side bar end*/}
        </div>
    );
}

export default App;
