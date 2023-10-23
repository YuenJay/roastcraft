import { onMount, onCleanup, Show } from "solid-js";
import { produce } from 'solid-js/store'
import { invoke } from "@tauri-apps/api/tauri";
import { trace, info, error, attachConsole } from "tauri-plugin-log-api";
import { UnlistenFn, emit, listen } from "@tauri-apps/api/event";
import MainChart from "./MainChart";
import InputChart from "./InputChart";
import useAppStore, { AppState } from "./AppStore";

function App() {

  const [appStore, setAppStore] = useAppStore;

  let detach: UnlistenFn;
  let unlisten: UnlistenFn;
  let intervalId: number = 0;
  onMount(async () => {

    // with LogTarget::Webview enabled this function will print logs to the browser console
    detach = await attachConsole();

    unlisten = await listen("read_metrics", (event: any) => {
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

  });

  onCleanup(() => {
    detach();
    unlisten();
  })

  async function buttonOnClicked() {
    await invoke("button_on_clicked");
    setAppStore({ appState: AppState.ON });
    trace("buttonOnClicked");
  }

  async function buttonOffClicked() {
    await invoke("button_off_clicked");
    setAppStore({ appState: AppState.OFF });
    trace("buttonOffClicked");
  }

  async function buttonStartClicked() {

    // allow only 1 setInterval running
    if (intervalId == 0) {
      intervalId = setInterval(() => {
        setAppStore({ timer: appStore.timer + 1 });
      }, 1000);
    }

    setAppStore({ appState: AppState.RECORDING });
    trace("buttonStartClicked");
  }

  async function buttonStopClicked() {

    if (intervalId != 0) {
      clearInterval(intervalId);
      intervalId = 0;
    }

    setAppStore({ appState: AppState.RECORDED });
    trace("buttonStopClicked");
  }

  async function buttonResetClicked() {
    // todo: clear appStore
    setAppStore({ appState: AppState.ON });
    trace("buttonResetClicked");
  }


  return (
    // responsive design breakpoint : lg
    <div class="grid grid-cols-9 lg:grid-cols-12">
      {/* header start*/}
      <div class="col-span-9 flex sticky top-0 m-1 gap-1">
        <div class="border bg-black rounded px-1 py-3">
          <p class="text-4xl font-extrabold text-white text-center ">
            {Math.floor(appStore.timer / 60).toString().padStart(2, '0') + ":" + (appStore.timer % 60).toString().padStart(2, '0')}
          </p>
        </div>
        <div class="border bg-base-300 rounded text-right p-1">
          <p>BT</p>
          <p class="text-2xl font-medium text-red-600">{appStore.BT}</p>
        </div>
        <div class="border bg-base-300 rounded text-right p-1">
          <p>Δ BT</p>
          <p class="text-2xl font-medium text-blue-600">15.4</p>
        </div>

        <div class="border bg-base-300 rounded text-right p-1">
          <p>ET</p>
          <p class="text-2xl font-medium text-red-600">205.2</p>
        </div>
        <div class="border bg-base-300 rounded text-right p-1">
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
      <div class="col-span-9 m-1">

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

      </div>
      {/* main end*/}

      {/* side bar start*/}
      <div class="col-span-9 lg:col-span-3 m-1">
        <InputChart />
        <InputChart />

        <div>
          <textarea
            placeholder="Logs"
            class="textarea textarea-bordered  w-full "
          ></textarea>
        </div>
      </div>
      {/* side bar end*/}
    </div>
  );
}

export default App;
