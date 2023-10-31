// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, onCleanup, Show, For } from "solid-js";
import { produce } from 'solid-js/store'
import { invoke } from "@tauri-apps/api/tauri";
import { trace, attachConsole } from "tauri-plugin-log-api";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import MainChart from "./MainChart";
import PhaseChart from "./PhaseChart";
import InputChart from "./InputChart";
import useAppStore, { AppState } from "./AppStore";

function App() {

  const [appStore, setAppStore] = useAppStore;

  let detach: UnlistenFn;
  let unlisten_reader: UnlistenFn;
  let unlisten_timer: UnlistenFn;

  onMount(async () => {

    // with LogTarget::Webview enabled this function will print logs to the browser console
    detach = await attachConsole();

    unlisten_reader = await listen("read_metrics", (event: any) => {
      trace("event \"read_metrics\" catched :" + JSON.stringify(event.payload));

      setAppStore({ BT: event.payload.bean_temp as number });

      let input = { "timestamp": appStore.timer, "value": event.payload.bean_temp };

      if (appStore.appState == AppState.RECORDING) {
        // localized mutation
        setAppStore(
          produce((appStore) => {
            appStore.metrics[0].data.push(input)
          })
        )
      }


    });

    unlisten_timer = await listen("timer", (event: any) => {
      trace("event \"timer\" catched :" + JSON.stringify(event.payload));
      setAppStore({ timer: event.payload });
    });

    setAppStore("logs", [...appStore.logs, "RoastCraft is ready"]);

  });

  onCleanup(() => {
    detach();
    unlisten_reader();
    unlisten_timer();
  })

  async function buttonOnClicked() {
    await invoke("button_on_clicked");
    setAppStore({ appState: AppState.ON, logs: [...appStore.logs, "start reading metrics"] });

  }

  async function buttonOffClicked() {
    await invoke("button_off_clicked");
    setAppStore({ appState: AppState.OFF, logs: [...appStore.logs, "stop reading metrics"] });

  }

  async function buttonStartClicked() {
    await invoke("button_start_clicked");
    setAppStore({ appState: AppState.RECORDING, logs: [...appStore.logs, "start recording"] });
  }

  async function buttonStopClicked() {
    await invoke("button_stop_clicked");
    setAppStore({ appState: AppState.RECORDED, logs: [...appStore.logs, "stop recording"] });
  }

  async function buttonResetClicked() {
    // todo: clear appStore
    setAppStore({ appState: AppState.ON });
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
        <div class="bg-base-300 rounded text-right p-1 ">
          <p>BT</p>
          <p class="text-2xl font-medium text-red-600">{appStore.BT}</p>
        </div>
        <div class="bg-base-300 rounded text-right w-20 p-1">
          <p>Δ BT</p>
          <p class="text-2xl font-medium text-blue-600">15.4</p>
        </div>

        <div class="bg-base-300 rounded text-right w-20 p-1">
          <p>ET</p>
          <p class="text-2xl font-medium text-red-600">205.2</p>
        </div>
        <div class="bg-base-300 rounded text-right w-20 p-1">
          <p>inlet</p>
          <p class="text-2xl font-medium text-red-600">350.3</p>
        </div>
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
        <ul class="steps w-full ">
          <li data-content="✓" class="step ">
            Charge
          </li>
          <li data-content="✓" class="step step-accent">
            Dry End
          </li>
          <li data-content="✓" class="step step-secondary">
            FC Start
          </li>
          <li data-content="✓" class="step step-secondary">
            FC End
          </li>
          <li data-content="✓" class="step step-accent">
            SC Start
          </li>
          <li data-content="✓" class="step step-error">
            Drop
          </li>
        </ul>
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
