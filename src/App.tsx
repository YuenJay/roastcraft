// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, onCleanup, Show, For, Index } from "solid-js";
import { produce, unwrap } from 'solid-js/store'
import { invoke } from "@tauri-apps/api/tauri";
import { trace, attachConsole, info } from "tauri-plugin-log-api";
import { UnlistenFn, listen } from "@tauri-apps/api/event";

import MainChart from "./MainChart";
import BarChart from "./BarChart";
import InputChart from "./InputChart";
import { GET, SET, AppStatus, EventId, Point, RoastPhase, appStateSig } from "./AppStore";
import WorkerFactory from "./WorkerFactory";
import timerWorker from "./timer.worker";
import { autoDetectChargeDrop, calculatePhases, calculateRor, findDryEnd, findRorOutlier, findTurningPoint, timestamp_format } from "./calculate";


function App() {

  const [appState, setAppState] = appStateSig;
  const [status, setStatus] = appState().statusSig;
  const [timer, setTimer] = appState().timerSig;
  const [metrics, setMetrics] = appState().metricsSig;
  const [metricIdList, setmetricIdList] = appState().metricsIdListSig;
  const [logs, setLogs] = appState().logsSig;
  const [events, setEvents] = appState().eventsSig;
  const [roastPhase, setRoastPhase] = appState().roastPhaseSig;
  const [dryingPhase, setDryingPhase] = appState().dryingPhaseSig;
  const [maillardPhase, setMaillardPhase] = appState().maillardPhaseSig;
  const [developPhase, setDevelopPhase] = appState().developPhaseSig;

  let detach: UnlistenFn;
  let unlisten_reader: UnlistenFn;
  let timer_worker: Worker;

  onMount(async () => {

    console.log(appState());


    // tauri-plugin-log-api
    // with LogTarget::Webview enabled this function will print logs to the browser console
    detach = await attachConsole();

    // event listener
    unlisten_reader = await listen("read_metrics", (event: any) => {
      trace("event \"read_metrics\" catched :" + JSON.stringify(event.payload));

      // update current metrics reading and ror

      let i;
      for (i = 0; i < metricIdList().length; i++) {

        metrics()[i].currentDataSig[SET](Number(event.payload[metricIdList()[i]]));

        /* calculate ROR start */
        metrics()[i].data_window.push(
          {
            value: Number(event.payload[metricIdList()[i]]),
            system_time: new Date().getTime()
          }
        );

        // buffer size of 5
        if (metrics()[i].data_window.length > 5) {
          metrics()[i].data_window.shift();
        }

        let delta = metrics()[i].data_window[metrics()[i].data_window.length - 1].value
          - metrics()[i].data_window[0].value;
        let time_elapsed_sec = (metrics()[i].data_window[metrics()[i].data_window.length - 1].system_time
          - metrics()[i].data_window[0].system_time)
          / 1000;

        metrics()[i].currentRorSig[SET](
          (Math.floor(delta / time_elapsed_sec * 60 * 10)) / 10 || 0
        );
        /* calculate ROR end */

        // write into history data
        if (status() == AppStatus.RECORDING) {
          metrics()[i].dataSig[SET](
            [...metrics()[i].dataSig[GET](), new Point(timer(), event.payload[metricIdList()[i]])]
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

    setLogs([...logs(), "RoastCraft is ready"]);

    // alternative: https://tauri.app/v1/api/js/globalshortcut/
    // but I think this is ok
    document.addEventListener("keydown", handleKeyDownEvent);
  });

  onCleanup(() => {
    detach();
    unlisten_reader();

  })

  async function buttonOnClicked() {
    await invoke("button_on_clicked");
    setStatus(AppStatus.ON);
    setLogs([...logs(), "start reading metrics..."]);
  }

  async function buttonOffClicked() {
    await invoke("button_off_clicked");
    setStatus(AppStatus.OFF);
    setLogs([...logs(), "stopped reading metrics"]);
  }

  async function buttonStartClicked() {
    timer_worker = new WorkerFactory(timerWorker) as Worker;
    timer_worker.postMessage(1000);
    timer_worker.onmessage = (event: any) => {
      setTimer(event.data);
    };

    setStatus(AppStatus.RECORDING);
    setLogs([...logs(), "start recording"]);
  }

  async function buttonStopClicked() {
    timer_worker.terminate();

    setStatus(AppStatus.RECORDED);
    setLogs([...logs(), "stopped recording"]);
  }

  async function buttonResetClicked() {
    // todo: clear appStore
    setStatus(AppStatus.ON);
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
    setEvents([...events(), { id: EventId.CHARGE, timestamp: timer(), value: metrics()[appState().btIndex].currentDataSig[GET]() }]);

    appState().eventCHARGESig[SET](true);
    appState().timeDeltaSig[SET](- timer());

    setRoastPhase(RoastPhase.DRYING);
  }

  async function handleDryEnd() {
    setEvents([...events(), { id: EventId.DRY_END, timestamp: timer(), value: metrics()[appState().btIndex].currentDataSig[GET]() }]);
    appState().eventDRY_ENDSig[SET](true);
    setRoastPhase(RoastPhase.MAILLARD);
  }

  async function handleFCStart() {
    setEvents([...events(), { id: EventId.FC_START, timestamp: timer(), value: metrics()[appState().btIndex].currentDataSig[GET]() }]);
    appState().eventFC_STARTSig[SET](true);
    setRoastPhase(RoastPhase.DEVELOP);
  }

  async function handleFCEnd() {
    setEvents([...events(), { id: EventId.FC_END, timestamp: timer(), value: metrics()[appState().btIndex].currentDataSig[GET]() }]);
    appState().eventFC_ENDSig[SET](true);
  }

  async function handleSCStart() {
    setEvents([...events(), { id: EventId.SC_START, timestamp: timer(), value: metrics()[appState().btIndex].currentDataSig[GET]() }]);
    appState().eventSC_STARTSig[SET](true);
  }

  async function handleSCEnd() {
    setEvents([...events(), { id: EventId.SC_END, timestamp: timer(), value: metrics()[appState().btIndex].currentDataSig[GET]() }]);
    appState().eventSC_ENDSig[SET](true);
  }

  async function handleDrop() {
    setEvents([...events(), { id: EventId.DROP, timestamp: timer(), value: metrics()[appState().btIndex].currentDataSig[GET]() }]);
    appState().eventDROPSig[SET](true);
    setRoastPhase(RoastPhase.AFTER_DROP);
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
          <p>{metrics()[appState().btIndex].id}</p>
          <p class="text-2xl font-medium text-red-600">
            {metrics()[appState().btIndex].currentDataSig[GET]().toFixed(1)}
          </p>
        </div>

        <div class="bg-base-300 rounded text-right w-20 p-1">
          <p>Δ BT</p>
          <p class="text-2xl font-medium text-blue-600">
            {metrics()[appState().btIndex].currentRorSig[GET]().toFixed(1)}
          </p>
        </div>

        <Index each={metricIdList()}>
          {
            (item, index) => (
              <Show when={index > 0}>
                <div class="bg-base-300 rounded text-right w-20 p-1">
                  <p>{metrics()[index].id}</p>
                  <p class="text-2xl font-medium text-red-600">
                    {metrics()[index].currentDataSig[GET]().toFixed(1)}
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
              <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">W</span>
              <button class="btn btn-accent" onClick={buttonStopClicked}>STOP</button>
            </div>
          </Show>

          <Show when={status() == AppStatus.RECORDED}>
            <div class="indicator">
              <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">R</span>
              <button class="btn btn-accent" onClick={buttonResetClicked}>RESET</button>
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
            <button class={`btn btn-outline btn-primary ${appState().eventCHARGESig[GET]() ? "btn-active btn-disabled" : ""}`}
              onClick={handleCharge}>
              {appState().eventCHARGESig[GET]() ? "✓ " : ""}CHARGE
            </button>
          </div>
          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">X</span>
            <button class={`btn btn-outline btn-primary ${appState().eventDRY_ENDSig[GET]() ? "btn-active btn-disabled" : ""}`}
              onClick={handleDryEnd}>
              {appState().eventDRY_ENDSig[GET]() ? "✓ " : ""}DRY END
            </button>
          </div>
          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">C</span>
            <button class={`btn btn-outline btn-primary ${appState().eventFC_STARTSig[GET]() ? "btn-active btn-disabled" : ""}`}
              onClick={handleFCStart}>
              {appState().eventFC_STARTSig[GET]() ? "✓ " : ""}FC START
            </button>
          </div>
          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">V</span>
            <button class={`btn btn-outline btn-primary ${appState().eventFC_ENDSig[GET]() ? "btn-active btn-disabled" : ""}`}
              onClick={handleFCEnd}>
              {appState().eventFC_ENDSig[GET]() ? "✓ " : ""}FC END
            </button>
          </div>

          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">B</span>
            <button class={`btn btn-outline btn-primary ${appState().eventSC_STARTSig[GET]() ? "btn-active btn-disabled" : ""}`}
              onClick={handleSCStart}>
              {appState().eventSC_STARTSig[GET]() ? "✓ " : ""}SC START
            </button>
          </div>
          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">N</span>
            <button class={`btn btn-outline btn-primary ${appState().eventSC_ENDSig[GET]() ? "btn-active btn-disabled" : ""}`}
              onClick={handleSCEnd}>
              {appState().eventSC_ENDSig[GET]() ? "✓ " : ""}SC END
            </button>
          </div>
          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">M</span>
            <button class={`btn btn-outline btn-primary ${appState().eventDROPSig[GET]() ? "btn-active btn-disabled" : ""}`}
              onClick={handleDrop}>
              {appState().eventDROPSig[GET]() ? "✓ " : ""}DROP
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
              { id: "#", opacity: 1, percent: dryingPhase().percent.toFixed(1), temp_rise: dryingPhase().temp_rise.toFixed(1) },
            ]} />
          <BarChart
            title="Maillard"
            data={[
              // { id: "Ref", opacity: 0.5, percent: 40.3, temp_rise: 44.8 },
              { id: "#", opacity: 1, percent: maillardPhase().percent.toFixed(1), temp_rise: maillardPhase().temp_rise.toFixed(1) },
            ]} />
          <BarChart
            title="Develop"
            data={[
              // { id: "Ref", opacity: 0.5, percent: 19.5, temp_rise: 13.0 },
              { id: "#", opacity: 1, percent: developPhase().percent.toFixed(1), temp_rise: developPhase().temp_rise.toFixed(1) },
            ]} />
        </div>

        <InputChart />

        <Show when={logs().length > 0}>

          <div class="text-sm">
            {/* show 5 lines of logs, newest on top */}
            <For each={logs().slice(-5).reverse()}>
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
