// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, onCleanup, Show, For, Index } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { trace, attachConsole, info } from "tauri-plugin-log-api";
import { UnlistenFn, listen } from "@tauri-apps/api/event";

import MainChart from "./MainChart";
import BarChart from "./BarChart";
import ManualChart from "./ManualChart";
import { GET, SET, AppStatus, EventId, Point, appStateSig, reset, Event } from "./AppState";
import WorkerFactory from "./WorkerFactory";
import timerWorker from "./timer.worker";
import { autoDetectChargeDrop, calculatePhases, calculateRor, findDryEnd, findRorOutlier, findTurningPoint, timestamp_format } from "./calculate";
import SecondaryChart from "./SecondaryChart";
import { openFile, saveFile } from "./fileUtil";

function App() {

    const [appState, setAppState] = appStateSig;
    const [status, setStatus] = appState().statusSig;
    const [timer, setTimer] = appState().timerSig;
    const [channelArr, setChannelArr] = appState().channelArrSig;
    const [logArr, setLogArr] = appState().logArrSig;
    const [events, setEvents] = appState().eventsSig;
    const [dryingPhase, setDryingPhase] = appState().dryingPhaseSig;
    const [maillardPhase, setMaillardPhase] = appState().maillardPhaseSig;
    const [developPhase, setDevelopPhase] = appState().developPhaseSig;
    const channelIdList = channelArr().map(m => m.id);

    let detach: UnlistenFn;
    let unlisten_reader: UnlistenFn;
    let unlisten_menu_event_listener: UnlistenFn;
    let timer_worker: Worker;

    onMount(async () => {

        console.log(appState());

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

        });

        // event listener
        unlisten_menu_event_listener = await listen("menu_event", (event: any) => {

            switch (event.payload) {
                case "OPEN":
                    console.log(event);
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
        setEvents({ ...events(), CHARGE: new Event(EventId.CHARGE, timer(), channelArr()[appState().btIndex].currentDataSig[GET]()) });
        appState().timeDeltaSig[SET](- timer());
    }

    async function handleDryEnd() {
        setEvents({ ...events(), DRY_END: new Event(EventId.DRY_END, timer(), channelArr()[appState().btIndex].currentDataSig[GET]()) });
    }

    async function handleFCStart() {
        setEvents({ ...events(), FC_START: new Event(EventId.FC_START, timer(), channelArr()[appState().btIndex].currentDataSig[GET]()) });
    }

    async function handleFCEnd() {
        setEvents({ ...events(), FC_END: new Event(EventId.FC_END, timer(), channelArr()[appState().btIndex].currentDataSig[GET]()) });
    }

    async function handleSCStart() {
        setEvents({ ...events(), SC_START: new Event(EventId.SC_START, timer(), channelArr()[appState().btIndex].currentDataSig[GET]()) });
    }

    async function handleSCEnd() {
        setEvents({ ...events(), SC_END: new Event(EventId.SC_END, timer(), channelArr()[appState().btIndex].currentDataSig[GET]()) });
    }

    async function handleDrop() {
        setEvents({ ...events(), DROP: new Event(EventId.DROP, timer(), channelArr()[appState().btIndex].currentDataSig[GET]()) });
    }

    return (
        // responsive design breakpoint : lg
        <div class="grid grid-cols-8 lg:grid-cols-12">
            {/* header start*/}
            <div class="col-span-8 flex top-0 m-1 gap-1">
                <div class="bg-black rounded flex items-center px-1">
                    <p class="text-4xl font-extrabold text-white ">
                        {timestamp_format(timer() + appState().timeDeltaSig[GET]())}
                    </p>
                </div>

                {/* BT */}
                <div class="bg-base-300 rounded text-right w-20 p-1 ">
                    <p>{channelArr()[appState().btIndex].id}</p>
                    <p class="text-2xl font-medium text-red-600">
                        {channelArr()[appState().btIndex].currentDataSig[GET]().toFixed(1)}
                    </p>
                </div>

                <div class="bg-base-300 rounded text-right w-20 p-1">
                    <p>Δ BT</p>
                    <p class="text-2xl font-medium text-blue-600">
                        {channelArr()[appState().btIndex].currentRorSig[GET]().toFixed(1)}
                    </p>
                </div>

                <Index each={channelIdList}>
                    {
                        (item, index) => (
                            <Show when={index != appState().btIndex}>
                                <div class="bg-base-300 rounded text-right w-20 p-1">
                                    <p>{channelArr()[index].id}</p>
                                    <p class="text-2xl font-medium text-red-600">
                                        {channelArr()[index].currentDataSig[GET]().toFixed(1)}
                                    </p>
                                </div>
                            </Show>
                        )
                    }
                </Index>

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

                <div class="ml-auto self-center flex gap-3 mr-3">
                    <Show when={status() == AppStatus.OFF}>
                        <div class="indicator">
                            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">R</span>
                            <button class="btn btn-accent" onClick={buttonResetClicked}>RESET</button>
                        </div>
                        <div class="indicator">
                            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">Q</span>
                            <button class="btn btn-accent " onClick={buttonOnClicked}>ON</button>
                        </div>
                    </Show>
                    <Show when={status() == AppStatus.ON}>
                        <div class="indicator">
                            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">Q</span>
                            <button class="btn btn-accent " onClick={buttonOffClicked}>OFF</button>
                        </div>
                        <div class="indicator">
                            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">W</span>
                            <button class="btn btn-accent " onClick={buttonStartClicked}>START</button>
                        </div>
                    </Show>
                    <Show when={status() == AppStatus.RECORDING}>
                        <div class="indicator">
                            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">Q</span>
                            <button class="btn btn-accent " onClick={buttonOffClicked}>OFF</button>
                        </div>
                    </Show>

                </div>
            </div>
            {/* header end*/}

            {/* main start*/}
            <div class="col-span-8 m-1">

                <MainChart />
                <div class="m-2 mb-4 flex justify-evenly">
                    <div class="indicator">
                        <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">Z</span>
                        <button class={`btn btn-sm btn-outline btn-primary ${events().CHARGE != undefined ? "btn-active btn-disabled" : ""}`}
                            onClick={handleCharge}>
                            {events().CHARGE != undefined ? "✓ " : ""}CHARGE
                        </button>
                    </div>
                    <div class="indicator">
                        <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">X</span>
                        <button class={`btn btn-sm btn-outline btn-primary ${events().DRY_END != undefined ? "btn-active btn-disabled" : ""}`}
                            onClick={handleDryEnd}>
                            {events().DRY_END != undefined ? "✓ " : ""}DRY END
                        </button>
                    </div>
                    <div class="indicator">
                        <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">C</span>
                        <button class={`btn btn-sm btn-outline btn-primary ${events().FC_START != undefined ? "btn-active btn-disabled" : ""}`}
                            onClick={handleFCStart}>
                            {events().FC_START != undefined ? "✓ " : ""}FC START
                        </button>
                    </div>
                    <div class="indicator">
                        <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">V</span>
                        <button class={`btn btn-sm btn-outline btn-primary ${events().FC_END != undefined ? "btn-active btn-disabled" : ""}`}
                            onClick={handleFCEnd}>
                            {events().FC_END != undefined ? "✓ " : ""}FC END
                        </button>
                    </div>

                    <div class="indicator">
                        <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">B</span>
                        <button class={`btn btn-sm btn-outline btn-primary ${events().SC_START != undefined ? "btn-active btn-disabled" : ""}`}
                            onClick={handleSCStart}>
                            {events().SC_START != undefined ? "✓ " : ""}SC START
                        </button>
                    </div>
                    <div class="indicator">
                        <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">N</span>
                        <button class={`btn btn-sm btn-outline btn-primary ${events().SC_END != undefined ? "btn-active btn-disabled" : ""}`}
                            onClick={handleSCEnd}>
                            {events().SC_END != undefined ? "✓ " : ""}SC END
                        </button>
                    </div>
                    <div class="indicator">
                        <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">M</span>
                        <button class={`btn btn-sm btn-outline btn-primary ${events().DROP != undefined ? "btn-active btn-disabled" : ""}`}
                            onClick={handleDrop}>
                            {events().DROP != undefined ? "✓ " : ""}DROP
                        </button>
                    </div>
                </div>


            </div>
            {/* main end*/}

            {/* side bar start*/}
            <div class="col-span-8 lg:col-span-4 m-1">

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

                <SecondaryChart />

                <ManualChart />

                <div class="grid grid-cols-3">
                    <label class="label cursor-pointer">
                        <span class="label-text ml-auto mr-2">ROR filtered</span>
                        <input type="checkbox" class="toggle toggle-sm" onChange={(e) => {
                            appState().toggleShowRorFilteredSig[SET](Boolean(e.currentTarget.checked));
                        }} />
                    </label>
                    <label class="label cursor-pointer">
                        <span class="label-text ml-auto mr-2">ROR outlier</span>
                        <input type="checkbox" class="toggle toggle-sm" onChange={(e) => {
                            appState().toggleShowRorOutlierSig[SET](Boolean(e.currentTarget.checked));
                        }} />
                    </label>
                    <label class="label cursor-pointer">
                        <span class="label-text ml-auto mr-2">ROR regression</span>
                        <input type="checkbox" class="toggle toggle-sm" onChange={(e) => {
                            appState().toggleShowRorRegressionSig[SET](Boolean(e.currentTarget.checked));
                        }} />
                    </label>
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
