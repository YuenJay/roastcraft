// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, onCleanup, Show, For, Index } from "solid-js";
import { produce, unwrap } from 'solid-js/store'
import { invoke } from "@tauri-apps/api/tauri";
import { trace, attachConsole, info } from "tauri-plugin-log-api";
import { UnlistenFn, listen } from "@tauri-apps/api/event";

import MainChart from "./MainChart";
import PhaseChart from "./PhaseChart";
import InputChart from "./InputChart";
import useAppStore, { AppState, EventId, Point, RoastPhase } from "./AppStore";
import WorkerFactory from "./WorkerFactory";
import timerWorker from "./timer.worker";
import { autoDetectChargeDrop, calculatePhases, calculateRor, findDryEnd, findRorOutlier, findTurningPoint, timestamp_format } from "./calculate";


function App() {

  const [appStore, setAppStore] = useAppStore;

  let detach: UnlistenFn;
  let unlisten_reader: UnlistenFn;
  let timer_worker: Worker;

  onMount(async () => {

    console.log(appStore)

    // tauri-plugin-log-api
    // with LogTarget::Webview enabled this function will print logs to the browser console
    detach = await attachConsole();

    // event listener
    unlisten_reader = await listen("read_metrics", (event: any) => {
      trace("event \"read_metrics\" catched :" + JSON.stringify(event.payload));

      // update current metrics reading and ror
      setAppStore(
        produce((appStore) => {
          let i;
          for (i = 0; i < appStore.metrics_id_list.length; i++) {

            appStore.metrics[i].current_data = Number(event.payload[appStore.metrics_id_list[i]]);

            /* calculate ROR start */
            appStore.metrics[i].data_window.push(
              {
                value: Number(event.payload[appStore.metrics_id_list[i]]),
                system_time: new Date().getTime()
              }
            );

            // buffer size of 5
            if (appStore.metrics[i].data_window.length > 5) {
              appStore.metrics[i].data_window.shift();
            }

            let delta = appStore.metrics[i].data_window[appStore.metrics[i].data_window.length - 1].value
              - appStore.metrics[i].data_window[0].value;
            let time_elapsed_sec = (appStore.metrics[i].data_window[appStore.metrics[i].data_window.length - 1].system_time
              - appStore.metrics[i].data_window[0].system_time)
              / 1000;

            appStore.metrics[i].current_ror = (Math.floor(delta / time_elapsed_sec * 60 * 10)) / 10 || 0
            /* calculate ROR end */

            // write into history data
            if (appStore.appState == AppState.RECORDING) {
              appStore.metrics[i].data.push(
                new Point(
                  appStore.timer,
                  event.payload[appStore.metrics_id_list[i]]
                )
              );
            }
          }
        })
      )

      // BT only for now
      calculateRor(0);
      findRorOutlier(0);
      autoDetectChargeDrop();
      findTurningPoint();
      findDryEnd();
      calculatePhases();

      console.log(unwrap(appStore));
    });

    setAppStore("logs", [...appStore.logs, "RoastCraft is ready"]);

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
    setAppStore({ appState: AppState.ON, logs: [...appStore.logs, "start reading metrics..."] });

  }

  async function buttonOffClicked() {
    await invoke("button_off_clicked");
    setAppStore({ appState: AppState.OFF, logs: [...appStore.logs, "stopped reading metrics"] });

  }

  async function buttonStartClicked() {
    timer_worker = new WorkerFactory(timerWorker) as Worker;
    timer_worker.postMessage(1000);
    timer_worker.onmessage = (event: any) => {
      setAppStore({ timer: event.data });
    };
    setAppStore({ appState: AppState.RECORDING, logs: [...appStore.logs, "start recording"] });
  }

  async function buttonStopClicked() {
    timer_worker.terminate();
    setAppStore({ appState: AppState.RECORDED, logs: [...appStore.logs, "stopped recording"] });
  }

  async function buttonResetClicked() {
    // todo: clear appStore
    setAppStore({ appState: AppState.ON });
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
    setAppStore(
      produce((appStore) => {
        appStore.event_state.CHARGE = true;
        appStore.events.push({ id: EventId.CHARGE, timestamp: appStore.timer, value: appStore.metrics[0].current_data });
        appStore.time_delta = - appStore.timer;
        appStore.RoastPhase = RoastPhase.DRYING;
      })
    )
  }

  async function handleDryEnd() {
    setAppStore(
      produce((appStore) => {
        appStore.event_state.DRY_END = true;
        appStore.events.push({ id: EventId.DRY_END, timestamp: appStore.timer, value: appStore.metrics[0].current_data });
        appStore.RoastPhase = RoastPhase.MAILLARD;
      })
    )
  }

  async function handleFCStart() {
    setAppStore(
      produce((appStore) => {
        appStore.event_state.FC_START = true;
        appStore.events.push({ id: EventId.FC_START, timestamp: appStore.timer, value: appStore.metrics[0].current_data });
        appStore.RoastPhase = RoastPhase.DEVELOP;
      })
    )
  }

  async function handleFCEnd() {
    setAppStore(
      produce((appStore) => {
        appStore.event_state.FC_END = true;
        appStore.events.push({ id: EventId.FC_END, timestamp: appStore.timer, value: appStore.metrics[0].current_data });
      })
    )
  }

  async function handleSCStart() {
    setAppStore(
      produce((appStore) => {
        appStore.event_state.SC_START = true;
        appStore.events.push({ id: EventId.SC_START, timestamp: appStore.timer, value: appStore.metrics[0].current_data });
      })
    )
  }

  async function handleSCEnd() {
    setAppStore(
      produce((appStore) => {
        appStore.event_state.SC_END = true;
        appStore.events.push({ id: EventId.SC_END, timestamp: appStore.timer, value: appStore.metrics[0].current_data });
      })
    )
  }

  async function handleDrop() {
    setAppStore(
      produce((appStore) => {
        appStore.event_state.DROP = true;
        appStore.events.push({ id: EventId.DROP, timestamp: appStore.timer, value: appStore.metrics[0].current_data });
        appStore.RoastPhase = RoastPhase.AFTER_DROP;
      })
    )
  }

  return (
    // responsive design breakpoint : lg
    <div class="grid grid-cols-8 lg:grid-cols-12">
      {/* header start*/}
      <div class="col-span-8 flex sticky top-0 m-1 gap-1">
        <div class="bg-black rounded flex items-center px-1">
          <p class="text-4xl font-extrabold text-white ">
            {timestamp_format(appStore.timer + appStore.time_delta)}
          </p>
        </div>

        {/* BT */}
        <div class="bg-base-300 rounded text-right w-20 p-1 ">
          <p>{appStore.metrics[0].id}</p>
          <p class="text-2xl font-medium text-red-600">
            {appStore.metrics[0].current_data.toFixed(1)}
          </p>
        </div>

        <div class="bg-base-300 rounded text-right w-20 p-1">
          <p>Δ BT</p>
          <p class="text-2xl font-medium text-blue-600">
            {appStore.metrics[0].current_ror.toFixed(1)}
          </p>
        </div>

        <Index each={appStore.metrics_id_list}>
          {
            (item, index) => (
              <Show when={index > 0}>
                <div class="bg-base-300 rounded text-right w-20 p-1">
                  <p>{appStore.metrics[index].id}</p>
                  <p class="text-2xl font-medium text-red-600">
                    {appStore.metrics[index].current_data.toFixed(1)}
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
              {timestamp_format(appStore.Drying_Phase.time)}
            </p>
            <p class="text-right text-sm font-medium text-blue-600">
              {appStore.Drying_Phase.temp_rise.toFixed(1)}°
            </p>
            <p class="text-sm font-medium text-blue-600">
              {appStore.Drying_Phase.percent.toFixed(1)}%
            </p>
          </div>
        </div>
        <div class="bg-base-300 rounded w-24 p-1">
          <p class="text-right">Maillard</p>
          <div class="grid grid-cols-2" >
            <p class="text-sm font-medium text-blue-600">
              {timestamp_format(appStore.Maillard_Phase.time)}
            </p>
            <p class="text-right text-sm font-medium text-blue-600">
              {appStore.Maillard_Phase.temp_rise.toFixed(1)}°
            </p>
            <p class="text-sm font-medium text-blue-600">
              {appStore.Maillard_Phase.percent.toFixed(1)}%
            </p>
          </div>
        </div>
        <div class="bg-base-300 rounded w-24 p-1">
          <p class="text-right">Develop</p>
          <div class="grid grid-cols-2" >
            <p class="text-sm font-medium text-blue-600">
              {timestamp_format(appStore.Develop_Phase.time)}
            </p>
            <p class="text-right text-sm font-medium text-blue-600">
              {appStore.Develop_Phase.temp_rise.toFixed(1)}°
            </p>
            <p class="text-sm font-medium text-blue-600">
              {appStore.Develop_Phase.percent.toFixed(1)}%
            </p>

          </div>
        </div>

        <div class="ml-auto self-center flex gap-3 mr-3">
          <Show when={appStore.appState == AppState.OFF}>
            <div class="indicator">
              <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">Q</span>
              <button class="btn btn-accent " onClick={buttonOnClicked}>ON</button>
            </div>
          </Show>

          <Show when={appStore.appState == AppState.ON}>
            <div class="indicator">
              <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">Q</span>
              <button class="btn btn-accent " onClick={buttonOffClicked}>OFF</button>
            </div>
            <div class="indicator">
              <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">W</span>
              <button class="btn btn-accent " onClick={buttonStartClicked}>START</button>
            </div>
          </Show>

          <Show when={appStore.appState == AppState.RECORDING}>
            <div class="indicator">
              <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">W</span>
              <button class="btn btn-accent" onClick={buttonStopClicked}>STOP</button>
            </div>
          </Show>

          <Show when={appStore.appState == AppState.RECORDED}>
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
            <button class={`btn btn-outline btn-primary ${appStore.event_state.CHARGE ? "btn-active btn-disabled" : ""}`}
              onClick={handleCharge}>
              {appStore.event_state.CHARGE ? "✓ " : ""}CHARGE
            </button>
          </div>
          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">X</span>
            <button class={`btn btn-outline btn-primary ${appStore.event_state.DRY_END ? "btn-active btn-disabled" : ""}`}
              onClick={handleDryEnd}>
              {appStore.event_state.DRY_END ? "✓ " : ""}DRY END
            </button>
          </div>
          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">C</span>
            <button class={`btn btn-outline btn-primary ${appStore.event_state.FC_START ? "btn-active btn-disabled" : ""}`}
              onClick={handleFCStart}>
              {appStore.event_state.FC_START ? "✓ " : ""}FC START
            </button>
          </div>
          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">V</span>
            <button class={`btn btn-outline btn-primary ${appStore.event_state.FC_END ? "btn-active btn-disabled" : ""}`}
              onClick={handleFCEnd}>
              {appStore.event_state.FC_END ? "✓ " : ""}FC END
            </button>
          </div>

          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">B</span>
            <button class={`btn btn-outline btn-primary ${appStore.event_state.SC_START ? "btn-active btn-disabled" : ""}`}
              onClick={handleSCStart}>
              {appStore.event_state.SC_START ? "✓ " : ""}SC START
            </button>
          </div>
          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">N</span>
            <button class={`btn btn-outline btn-primary ${appStore.event_state.SC_END ? "btn-active btn-disabled" : ""}`}
              onClick={handleSCEnd}>
              {appStore.event_state.SC_END ? "✓ " : ""}SC END
            </button>
          </div>
          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">M</span>
            <button class={`btn btn-outline btn-primary ${appStore.event_state.DROP ? "btn-active btn-disabled" : ""}`}
              onClick={handleDrop}>
              {appStore.event_state.DROP ? "✓ " : ""}DROP
            </button>
          </div>
        </div>

        <PhaseChart />
      </div>
      {/* main end*/}

      {/* side bar start*/}
      <div class="col-span-8 lg:col-span-4 m-1">
        <InputChart />
        <InputChart />

        <Show when={appStore.logs.length > 0}>

          <div class="text-sm">
            {/* show 5 lines of logs, newest on top */}
            <For each={appStore.logs.slice(-5).reverse()}>
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
