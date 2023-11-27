// SPDX-License-Identifier: GPL-3.0-or-later

import { onMount, onCleanup, Show, For, Index } from "solid-js";
import { produce, unwrap } from 'solid-js/store'
import { invoke } from "@tauri-apps/api/tauri";
import { trace, attachConsole, info } from "tauri-plugin-log-api";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { mean, standardDeviation } from "simple-statistics";
// import { median, medianAbsoluteDeviation } from "simple-statistics";
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
                {
                  timestamp: appStore.timer,
                  value: event.payload[appStore.metrics_id_list[i]],
                }
              );
            }
          }
        })
      )

      // BT only for now
      calculateRor(0);
      findRorOutlier(0);
      autoDetectCharge();


      console.log(unwrap(appStore));
    });

    setAppStore("logs", [...appStore.logs, "RoastCraft is ready"]);
  });

  onCleanup(() => {
    detach();
    unlisten_reader();

  })

  function calculateRor(metrics_index: number) {
    let data: Array<any> = unwrap(appStore.metrics[metrics_index].data);

    let ror_array = Array<any>();

    for (let i = 0; i < data.length; i++) {

      let window_size = 5
      let window = data.slice(Math.max(0, i - window_size + 1), i + 1);

      let delta = window[window.length - 1].value - window[0].value;
      let time_elapsed_sec = window[window.length - 1].timestamp - window[0].timestamp;

      let ror = (Math.floor(delta / time_elapsed_sec * 60 * 10)) / 10 || 0

      ror_array.push(
        {
          timestamp: data[i].timestamp,
          value: ror,
        }
      );

    }

    setAppStore(
      produce((appStore) => {
        appStore.metrics[metrics_index].ror = ror_array;
      })
    )

  }

  function findRorOutlier(metrics_index: number) {

    let ror: Array<any> = unwrap(appStore.metrics[metrics_index].ror);

    for (let i = 0; i < ror.length; i++) {
      if (i == 0) {
        continue;
      }

      let window_size = 5
      let window = ror.slice(Math.max(0, i - window_size), i).map(r => r.value); // window doesn't include i

      let ma = mean(window); // moving average
      let sd = standardDeviation(window); // standard deviation
      let zScore = Math.abs((ror[i].value - ma) / sd);

      // https://eurekastatistics.com/using-the-median-absolute-deviation-to-find-outliers/
      // The MAD=0 Problem
      // If more than 50% of your data have identical values, your MAD will equal zero. 
      // All points in your dataset except those that equal the median will then be flagged as outliers, 
      // regardless of the level at which you've set your outlier cutoff. 
      // (By constrast, if you use the standard-deviations-from-mean approach to finding outliers, 
      // Chebyshev's inequality puts a hard limit on the percentage of points that may be flagged as outliers.) 
      // So at the very least check that you don't have too many identical data points before using the MAD to flag outliers.

      // let m = median(window);
      // let mad = medianAbsoluteDeviation(window);
      // let modifiedZScore = Math.abs(0.6745 * (ror[i].value - m) / mad);
      // console.log(m);
      // console.log(mad);
      // console.log("modifiedZScore: " + modifiedZScore);

      if (zScore > 3) {
        setAppStore(
          produce((appStore) => {
            appStore.metrics[metrics_index].ror[i].outlier = true;
          })
        )
      }

    }
  }

  // reference: artisan/src/artisanlib/main.py  BTbreak()
  // idea:
  // . average delta before i-2 is not negative
  // . average delta after i-2 is negative and twice as high (absolute) as the one before
  function autoDetectCharge() {
    let m_index: number = 0 // metrics index for BT
    let ror: Array<any> = unwrap(appStore.metrics[m_index].ror);

    let window_size = 5
    if (ror.length >= window_size) {

      let window = ror.slice(Math.max(0, ror.length - window_size), ror.length).map(r => r.value);

      // window array: [    0][    1][     2][    3][    4]
      //    ror array: [len-5][len-4][*len-3][len-2][len-1]
      //                              ^^^^^^
      //                              CHARGE

      let dpre = window[1] + window[2] / 2.0;
      let dpost = window[3] + window[4] / 2.0;
      if (window[1] > 0.0 && window[2] > 0.0
        && window[3] < 0.0 && window[3] < 0.0
        && Math.abs(dpost) > Math.abs(dpre) * 2) {
        let target_index = ror.length - 3;

        if (appStore.phase_button_state.CHARGE == false) {
          info("auto detected charge at ror index: " + (target_index));

          setAppStore(
            produce((appStore) => {
              appStore.phase_button_state.CHARGE = true;
              appStore.events.push({
                type: "PHASE",
                id: "CHARGE",
                timestamp: appStore.metrics[m_index].data[target_index].timestamp,
                value: appStore.metrics[m_index].data[target_index].value
              });
              appStore.time_delta = - appStore.metrics[m_index].data[target_index].timestamp;
            })
          )
        } else if (appStore.phase_button_state.CHARGE == true && appStore.phase_button_state.DROP == false) {
          info("auto detected drop at ror index: " + (target_index));

          setAppStore(
            produce((appStore) => {
              appStore.phase_button_state.DROP = true;
              appStore.events.push({
                type: "PHASE",
                id: "DROP",
                timestamp: appStore.metrics[m_index].data[target_index].timestamp,
                value: appStore.metrics[m_index].data[target_index].value
              });

            })
          )
        }


      }


    }
  }

  // find lowest point in BT
  function findTurningPoint() {

    // generate an event
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
        timestamp: appStore.timer,
        value: appStore.metrics[0].current_data
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
            {appStore.phase_button_state.CHARGE ? "✓ " : ""}Charge
          </button>
          <button class={`btn btn-outline btn-primary ${appStore.phase_button_state.DRY_END ? "btn-active btn-disabled" : ""}`}
            onClick={() => phaseButtonClicked("DRY_END")}>
            {appStore.phase_button_state.DRY_END ? "✓ " : ""}Dry End
          </button>
          <button class="btn btn-outline btn-primary">FC Start</button>
          <button class="btn btn-outline btn-primary">FC End</button>
          <button class="btn btn-outline btn-primary">SC Start</button>
          <button class="btn btn-outline btn-primary">SC End</button>
          <button class={`btn btn-outline btn-primary ${appStore.phase_button_state.DROP ? "btn-active btn-disabled" : ""}`}
            onClick={() => phaseButtonClicked("DROP")}>
            {appStore.phase_button_state.DROP ? "✓ " : ""}Drop
          </button>
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
