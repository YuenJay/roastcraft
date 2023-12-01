// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, onCleanup, Show, For, Index } from "solid-js";
import { produce, unwrap } from 'solid-js/store'
import { invoke } from "@tauri-apps/api/tauri";
import { trace, attachConsole, info } from "tauri-plugin-log-api";
import { UnlistenFn, listen } from "@tauri-apps/api/event";

import MainChart from "./MainChart";
import PhaseChart from "./PhaseChart";
import InputChart from "./InputChart";
import useAppStore, { AppState, Point } from "./AppStore";
import WorkerFactory from "./WorkerFactory";
import timerWorker from "./timer.worker";
import { autoDetectChargeDrop, calculateRor, findDryEnd, findRorOutlier, findTurningPoint, timestamp_format } from "./calculate";


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

  async function phaseButtonClicked(event_id: string) {
    trace!("phaseButtonClicked: " + event_id);
    setAppStore(produce((appStore) => {
      (appStore.phase_state as any)[event_id] = true;
      appStore.events.push({
        type: "PHASE",
        id: event_id,
        timestamp: appStore.timer,
        value: appStore.metrics[0].current_data
      });
    }));
  }

  function handleKeyDownEvent(event: KeyboardEvent) {
    trace("key down event: " + event.code);
    switch (event.code) {
      case 'KeyZ':
        phaseButtonClicked("CHARGE")
        break;
      default:

    }
  }

  return (
    // responsive design breakpoint : lg
    <div class="grid grid-cols-8 lg:grid-cols-12">
      {/* header start*/}
      <div class="col-span-8 flex sticky top-0 m-1 gap-1">
        <div class="bg-black rounded flex items-center px-1">
          <p class="text-4xl font-extrabold text-white ">
            {timestamp_format(appStore.timer)}
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
            <button class={`btn btn-outline btn-primary ${appStore.phase_state.CHARGE ? "btn-active btn-disabled" : ""}`}
              onClick={() => phaseButtonClicked("CHARGE")}>
              {appStore.phase_state.CHARGE ? "✓ " : ""}CHARGE
            </button>
          </div>
          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">X</span>
            <button class={`btn btn-outline btn-primary ${appStore.phase_state.DRY_END ? "btn-active btn-disabled" : ""}`}
              onClick={() => phaseButtonClicked("DRY_END")}>
              {appStore.phase_state.DRY_END ? "✓ " : ""}DRY END
            </button>
          </div>
          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">C</span>
            <button class={`btn btn-outline btn-primary ${appStore.phase_state.FC_START ? "btn-active btn-disabled" : ""}`}
              onClick={() => phaseButtonClicked("FC_START")}>
              {appStore.phase_state.FC_START ? "✓ " : ""}FC START
            </button>
          </div>
          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">V</span>
            <button class={`btn btn-outline btn-primary ${appStore.phase_state.FC_END ? "btn-active btn-disabled" : ""}`}
              onClick={() => phaseButtonClicked("FC_END")}>
              {appStore.phase_state.FC_END ? "✓ " : ""}FC END
            </button>
          </div>

          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">B</span>
            <button class={`btn btn-outline btn-primary ${appStore.phase_state.SC_START ? "btn-active btn-disabled" : ""}`}
              onClick={() => phaseButtonClicked("SC_START")}>
              {appStore.phase_state.SC_START ? "✓ " : ""}SC START
            </button>
          </div>
          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">N</span>
            <button class={`btn btn-outline btn-primary ${appStore.phase_state.SC_END ? "btn-active btn-disabled" : ""}`}
              onClick={() => phaseButtonClicked("SC_END")}>
              {appStore.phase_state.SC_END ? "✓ " : ""}SC END
            </button>
          </div>
          <div class="indicator">
            <span class="indicator-item indicator-bottom indicator-end badge rounded border-current px-1">M</span>
            <button class={`btn btn-outline btn-primary ${appStore.phase_state.DROP ? "btn-active btn-disabled" : ""}`}
              onClick={() => phaseButtonClicked("DROP")}>
              {appStore.phase_state.DROP ? "✓ " : ""}DROP
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
