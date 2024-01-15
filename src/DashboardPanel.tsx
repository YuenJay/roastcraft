// SPDX-License-Identifier: GPL-3.0-or-later

import { invoke } from "@tauri-apps/api/tauri";
import { For, Show, createEffect, } from "solid-js";
import { GET, SET, BT, AppStatus, RoastEventId, appStateSig, reset, RoastEvent, Channel } from "./AppState";
import { timestamp_format } from "./calculate";
import WorkerFactory from "./WorkerFactory";
import timerWorker from "./timer.worker";
import PhaseChart from "./PhaseChart";
import PhaseTempChart from "./PhaseTempChart";
import RangeInput from "./RangeInput";


export default function DashboardPanel(props: any) {

    const [appState, _setAppState] = appStateSig;
    const [status, setStatus] = appState().statusSig;
    const [timer, setTimer] = appState().timerSig;
    const [channelArr, _setChannelArr] = appState().channelArrSig;
    const [logArr, setLogArr] = appState().logArrSig;
    const [roastEvents, setRoastEvents] = appState().roastEventsSig;
    const [manualChannelArr, _setManualChannelArr] = appState().manualChannelArrSig;
    const [dryingPhase, _setDryingPhase] = appState().dryingPhaseSig;
    const [maillardPhase, _setMaillardPhase] = appState().maillardPhaseSig;
    const [developPhase, _setDevelopPhase] = appState().developPhaseSig;
    const bt = channelArr().find(c => c.id == BT) as Channel;
    let timer_worker: Worker;

    const [ghost, _setGhost] = appState().ghostSig;

    createEffect(() => {

    });

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

    async function handleCharge() {
        setRoastEvents({ ...roastEvents(), CHARGE: new RoastEvent(RoastEventId.CHARGE, timer(), bt.currentDataSig[GET]()) });
        appState().timeDeltaSig[SET](- timer());
    }

    async function handleDryEnd() {
        setRoastEvents({ ...roastEvents(), DRY_END: new RoastEvent(RoastEventId.DRY_END, timer(), bt.currentDataSig[GET]()) });
    }

    async function handleFCStart() {
        setRoastEvents({ ...roastEvents(), FC_START: new RoastEvent(RoastEventId.FC_START, timer(), bt.currentDataSig[GET]()) });
    }

    async function handleFCEnd() {
        setRoastEvents({ ...roastEvents(), FC_END: new RoastEvent(RoastEventId.FC_END, timer(), bt.currentDataSig[GET]()) });
    }

    async function handleSCStart() {
        setRoastEvents({ ...roastEvents(), SC_START: new RoastEvent(RoastEventId.SC_START, timer(), bt.currentDataSig[GET]()) });
    }

    async function handleSCEnd() {
        setRoastEvents({ ...roastEvents(), SC_END: new RoastEvent(RoastEventId.SC_END, timer(), bt.currentDataSig[GET]()) });
    }

    async function handleDrop() {
        setRoastEvents({ ...roastEvents(), DROP: new RoastEvent(RoastEventId.DROP, timer(), bt.currentDataSig[GET]()) });
    }

    return (
        <>
            {/* timer and on/off buttons */}
            <div class="flex flex-wrap gap-1">
                <div class="flex items-center justify-center bg-black text-white rounded text-4xl font-extrabold w-28 ">
                    <Show when={status() == AppStatus.ON || status() == AppStatus.RECORDING} fallback={"00:00"}>
                        {timestamp_format(timer() + appState().timeDeltaSig[GET]())}
                    </Show>
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
                    <p>{bt.id}</p>
                    <p class="text-2xl leading-tight text-red-600">
                        {bt.currentDataSig[GET]().toFixed(1)}
                    </p>
                </div>

                <div class="bg-base-300 rounded text-right w-20 px-1">
                    <p >Δ BT</p>
                    <p class="text-2xl leading-tight text-blue-600">
                        {bt.currentRorSig[GET]().toFixed(1)}
                    </p>
                </div>

                <For each={channelArr().filter(c => c.id != BT)}>
                    {(c) => (
                        <div class="bg-base-300 rounded text-right w-20 px-1">
                            <p>{c.id}</p>
                            <p class="text-2xl leading-tight text-red-600">
                                {c.currentDataSig[GET]().toFixed(1)}
                            </p>
                        </div>
                    )}
                </For>

            </div>
            <div>
                <Show when={appState().isGhostLoadedSig[GET]()}>
                    <PhaseChart data={
                        [
                            { id: "Dry", phase: ghost().dryingPhase },
                            { id: "Mai", phase: ghost().maillardPhase },
                            { id: "Dev", phase: ghost().developPhase },
                        ]
                    } opacity={0.6}></PhaseChart>
                </Show>
                <PhaseChart data={
                    [
                        { id: "Dry", phase: dryingPhase() },
                        { id: "Mai", phase: maillardPhase() },
                        { id: "Dev", phase: developPhase() },
                    ]
                }></PhaseChart>
                <Show when={appState().isGhostLoadedSig[GET]()}>
                    <PhaseTempChart data={
                        [
                            { id: "Dry", phase: ghost().dryingPhase },
                            { id: "Mai", phase: ghost().maillardPhase },
                            { id: "Dev", phase: ghost().developPhase },
                        ]
                    } opacity={0.6}></PhaseTempChart>
                </Show>
                <PhaseTempChart data={
                    [
                        { id: "Dry", phase: dryingPhase() },
                        { id: "Mai", phase: maillardPhase() },
                        { id: "Dev", phase: developPhase() },
                    ]
                }></PhaseTempChart>
            </div>
            {/* event buttons */}
            <div class="flex flex-wrap gap-1">

                <button class={`relative btn btn-primary rounded w-20 
                    ${roastEvents().CHARGE != undefined ? "btn-disabled" : ""}
                    ${status() != AppStatus.RECORDING ? "btn-disabled" : ""}
                    `}
                    onClick={handleCharge}>
                    CHARGE
                    <span class="absolute bottom-0 right-0 mr-1 underline text-xs">Z</span>
                </button>

                <button class={`relative btn btn-primary rounded w-20 
                    ${roastEvents().DRY_END != undefined ? "btn-disabled" : ""}
                    ${status() != AppStatus.RECORDING ? "btn-disabled" : ""}
                    `}
                    onClick={handleDryEnd}>
                    DRY END
                    <span class="absolute bottom-0 right-0 mr-1 underline text-xs">X</span>
                </button>

                <button class={`relative btn btn-primary rounded w-20 
                    ${roastEvents().FC_START != undefined ? "btn-disabled" : ""}
                    ${status() != AppStatus.RECORDING ? "btn-disabled" : ""}
                    `}
                    onClick={handleFCStart}>
                    FC START
                    <span class="absolute bottom-0 right-0 mr-1 underline text-xs">C</span>
                </button>

                <button class={`relative btn btn-primary rounded w-20 
                    ${roastEvents().FC_END != undefined ? "btn-disabled" : ""}
                    ${status() != AppStatus.RECORDING ? "btn-disabled" : ""}
                    `}
                    onClick={handleFCEnd}>
                    FC END
                    <span class="absolute bottom-0 right-0 mr-1 underline text-xs">V</span>
                </button>

                <button class={`relative btn btn-primary rounded w-20 
                    ${roastEvents().SC_START != undefined ? "btn-disabled" : ""}
                    ${status() != AppStatus.RECORDING ? "btn-disabled" : ""}
                    `}
                    onClick={handleSCStart}>
                    SC START
                    <span class="absolute bottom-0 right-0 mr-1 underline text-xs">B</span>
                </button>

                <button class={`relative btn btn-primary rounded w-20 
                    ${roastEvents().SC_END != undefined ? "btn-disabled" : ""}
                    ${status() != AppStatus.RECORDING ? "btn-disabled" : ""}
                    `}
                    onClick={handleSCEnd}>
                    SC END
                    <span class="absolute bottom-0 right-0 mr-1 underline text-xs">N</span>
                </button>

                <button class={`relative btn btn-primary rounded w-20 
                    ${roastEvents().DROP != undefined ? "btn-disabled" : ""}
                    ${status() != AppStatus.RECORDING ? "btn-disabled" : ""}
                    `}
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
            <Show when={logArr().length > 0}>

                <div class="text-sm">
                    {/* show 5 lines of logArr, newest on top */}
                    <For each={logArr().slice(-5).reverse()}>
                        {(item) => <p class="px-1 border-b first:bg-base-200">{item.toString()}</p>}
                    </For>

                </div>
            </Show>
        </>

    )
}