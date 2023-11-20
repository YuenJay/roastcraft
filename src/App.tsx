// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, onCleanup, Show, For, Index } from "solid-js";
import { produce } from 'solid-js/store'
import { invoke } from "@tauri-apps/api/tauri";
import { trace, attachConsole } from "tauri-plugin-log-api";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import MainChart from "./MainChart";
import PhaseChart from "./PhaseChart";
import InputChart from "./InputChart";
import useAppStore, { AppState } from "./AppStore";
import WorkerFactory from "./WorkerFactory";
import timerWorker from "./timer.worker";

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

            appStore.metrics[i].current_reading = Number(event.payload[appStore.metrics_id_list[i]]);

            appStore.metrics[i].readings_buffer.push(
              {
                "value": Number(event.payload[appStore.metrics_id_list[i]]),
                "system_time": new Date().getTime()
              }
            );

            // buffer size of 5
            if (appStore.metrics[i].readings_buffer.length > 5) {
              appStore.metrics[i].readings_buffer.shift();
            }

            let delta = appStore.metrics[i].readings_buffer[appStore.metrics[i].readings_buffer.length - 1].value - appStore.metrics[i].readings_buffer[0].value;
            let time_elapsed_sec = (appStore.metrics[i].readings_buffer[appStore.metrics[i].readings_buffer.length - 1].system_time
              - appStore.metrics[i].readings_buffer[0].system_time)
              / 1000;

            appStore.metrics[i].rate_of_rise = (Math.floor(delta / time_elapsed_sec * 60 * 10)) / 10 || 0

            // write into history data
            if (appStore.appState == AppState.RECORDING) {
              appStore.metrics[i].data.push(
                {
                  "timestamp": appStore.timer,
                  "value": event.payload[appStore.metrics_id_list[i]],
                }
              );

              appStore.metrics[i].ror_data.push(
                {
                  "timestamp": appStore.timer,
                  "value": appStore.metrics[i].rate_of_rise,
                }
              );
            }
          }
        })
      )

      console.log(appStore.metrics);
    });

    setAppStore("logs", [...appStore.logs, "RoastCraft is ready"]);
  });

  onCleanup(() => {
    detach();
    unlisten_reader();

  })

  function calculate() {

  }

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
      trace("time worker event data:" + JSON.stringify(event.data));
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
      (appStore.phase_button_state as any)[event_id] = true;
      appStore.events.push({
        type: "PHASE",
        id: event_id,
        timestamp: appStore.timer
      });
    }));
  }

  return (
    // responsive design breakpoint : lg
    <div class="grid grid-cols-8 lg:grid-cols-12">
      {/* header start*/}
      <div class="col-span-8 flex sticky top-0 m-1 gap-1">
        <div class="bg-black rounded flex items-center px-1">
          <p class="text-4xl font-extrabold text-white ">
            {Math.floor(appStore.timer / 60).toString().padStart(2, '0') + ":" + (appStore.timer % 60).toString().padStart(2, '0')}
          </p>
        </div>

        {/* BT */}
        <div class="bg-base-300 rounded text-right w-20 p-1 ">
          <p>{appStore.metrics[0].id}</p>
          <p class="text-2xl font-medium text-red-600">
            {appStore.metrics[0].current_reading.toFixed(1)}
          </p>
        </div>

        <div class="bg-base-300 rounded text-right w-20 p-1">
          <p>Δ BT</p>
          <p class="text-2xl font-medium text-blue-600">
            {appStore.metrics[0].rate_of_rise.toFixed(1)}
          </p>
        </div>

        <Index each={appStore.metrics_id_list}>
          {
            (item, index) => (
              <Show when={index > 0}>
                <div class="bg-base-300 rounded text-right w-20 p-1">
                  <p>{appStore.metrics[index].id}</p>
                  <p class="text-2xl font-medium text-red-600">
                    {appStore.metrics[index].current_reading.toFixed(1)}
                  </p>
                </div>
              </Show>
            )
          }
        </Index>

        <div class="ml-auto self-center flex gap-1">
          <Show when={appStore.appState == AppState.OFF}>
            <button class="btn btn-accent " onClick={buttonOnClicked}>on</button>
          </Show>

          <Show when={appStore.appState == AppState.ON}>
            <button class="btn btn-accent " onClick={buttonOffClicked}>off</button>
            <button class="btn btn-accent " onClick={buttonStartClicked}>start</button>
          </Show>

          <Show when={appStore.appState == AppState.RECORDING}>
            <button class="btn btn-accent mr-2" onClick={buttonStopClicked}>stop</button>
          </Show>

          <Show when={appStore.appState == AppState.RECORDED}>
            <button class="btn btn-accent mr-2" onClick={buttonResetClicked}>reset</button>
          </Show>
        </div>
      </div>
      {/* header end*/}

      {/* main start*/}
      <div class="col-span-8 m-1">

        <MainChart />
        <div class="m-2 flex justify-evenly">
          <button class={`btn btn-outline btn-primary ${appStore.phase_button_state.CHARGE ? "btn-active btn-disabled" : ""}`}
            onClick={() => phaseButtonClicked("CHARGE")}>
            {appStore.phase_button_state.CHARGE ? "✓ " : ""}charge
          </button>
          <button class={`btn btn-outline btn-primary ${appStore.phase_button_state.DRY_END ? "btn-active btn-disabled" : ""}`}
            onClick={() => phaseButtonClicked("DRY_END")}>
            {appStore.phase_button_state.DRY_END ? "✓ " : ""}Dry End
          </button>
          <button class="btn btn-outline btn-primary">FC Start</button>
          <button class="btn btn-outline btn-primary">FC End</button>
          <button class="btn btn-outline btn-primary">SC Start</button>
          <button class="btn btn-outline btn-primary">SC End</button>
          <button class="btn btn-outline btn-primary">Drop</button>
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
