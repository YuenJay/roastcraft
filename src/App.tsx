import { createSignal, onMount, onCleanup, Show, createEffect } from "solid-js";
import { createStore, produce } from 'solid-js/store'
import { invoke } from "@tauri-apps/api/tauri";
import { trace, info, error, attachConsole } from "tauri-plugin-log-api";
import { UnlistenFn, emit, listen } from "@tauri-apps/api/event";
import * as d3 from "d3";

function App() {

  enum AppState {
    OFF,
    ON,
    RECORDING,
    RECORDED
  }

  const [appStore, setAppStore] = createStore({
    appState: AppState.OFF,
    timer: 0,
    BT: 0.0,
    metrics: [{ id: "BT", label: "Bean Temp", unit: "celcius", data: new Array() }]
  })

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

      // localized mutation
      setAppStore(
        produce((appStore) => {
          appStore.metrics[0].data.push(input)
        })
      )

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


  function LinePlot({
    data = appStore.metrics[0].data,
    width = 800,
    height = 400,
    marginTop = 30,
    marginRight = 30,
    marginBottom = 30,
    marginLeft = 30,
  }) {
    const xScale = d3.scaleLinear(
      [0, 600],
      [marginLeft, width - marginRight]
    );
    const yScale = d3.scaleLinear([0, 300], [
      height - marginBottom,
      marginTop,
    ]);

    const line = d3.line()
      .x((d: any) => xScale(d.timestamp))
      .y((d: any) => yScale(d.value));

    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height);

    svg.append("path")
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("stroke-width", 1.5)


    svg.append("g")
      .attr("fill", "white")
      .attr("stroke", "currentColor")
      .attr("stroke-width", 1)
      .append("circle")
      .attr("r", 2)
      .attr("cx", xScale(0))
      .attr("cy", yScale(0));

    createEffect(() => {
      svg.select("path")
        .attr("d", line(data));
      svg.select("g").select("circle")
        .attr("cx", xScale(data[data.length - 1].timestamp))
        .attr("cy", yScale(data[data.length - 1].value));
    });

    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(xScale));
    svg.append("g")
      .attr("transform", `translate(${marginLeft}, 0)`)
      .call(d3.axisLeft(yScale));

    return svg.node();
    // return (
    //   <svg width={width} height={height}>
    //     <path
    //       fill="none"
    //       stroke="currentColor"
    //       stroke-width="1.5"
    //       d={line(data) as string | undefined}
    //     />
    //     <g fill="white" stroke="currentColor" stroke-width="1">
    //       {data.map((d: any) => (
    //         <circle cx={xScale(d.timestamp)} cy={yScale(d.value)} r="2" />
    //       ))}
    //     </g>
    //   </svg>
    // );
  }

  return (
    <div class="h-screen grid grid-cols-[140px_1fr] grid-rows-[60px_1fr] ">
      {/* header start*/}
      <div class="col-start-1 col-end-3 row-start-1 row-end-2 flex justify-end items-center">
        <Show when={appStore.appState == AppState.OFF}>
          <button class="btn btn-accent mr-2" onClick={buttonOnClicked}>on</button>
        </Show>

        <Show when={appStore.appState == AppState.ON}>
          <button class="btn btn-accent mr-2" onClick={buttonOffClicked}>off</button>
          <button class="btn btn-accent mr-2" onClick={buttonStartClicked}>start</button>
        </Show>

        <Show when={appStore.appState == AppState.RECORDING}>
          <button class="btn btn-accent mr-2" onClick={buttonStopClicked}>stop</button>
        </Show>

        <Show when={appStore.appState == AppState.RECORDED}>
          <button class="btn btn-accent mr-2" onClick={buttonResetClicked}>reset</button>
        </Show>
      </div>
      {/* header end*/}
      {/* sidebar start*/}
      <div class="col-start-1 col-end-2 row-start-2 row-end-3 overflow-y-auto px-1">
        <div class="border bg-black rounded mb-1 py-2 text-center sticky top-0">
          <p class="text-4xl font-extrabold  text-white">
            {Math.floor(appStore.timer / 60).toString().padStart(2, '0') + ":" + (appStore.timer % 60).toString().padStart(2, '0')}
          </p>
        </div>
        <div class="border bg-base-300 rounded mb-1 p-1 text-right ">
          <p>BT</p>
          <p class="text-2xl font-medium text-red-600">{appStore.BT}</p>
        </div>
        <div class="border bg-base-300 rounded mb-1 p-1 text-right">
          <p>Δ BT</p>
          <p class="text-2xl font-medium text-blue-600">15.4</p>
        </div>

        <div class="border bg-base-300 rounded mb-1 p-1 text-right">
          <p>ET</p>
          <p class="text-2xl font-medium text-red-600">205.2</p>
        </div>
        <div class="border bg-base-300 rounded mb-1 p-1 text-right">
          <p>inlet</p>
          <p class="text-2xl font-medium text-red-600">350.3</p>
        </div>

        <div class="border bg-base-300 collapse collapse-arrow rounded mb-1 p-1 text-right">
          <input type="checkbox" class="min-h-0" checked />
          <p class="collapse-title p-0 min-h-0 text-sm font-bold">Drying</p>
          <div class="collapse-content p-0 min-h-0 ">
            <div>
              <span class="text-sm">time</span> &nbsp
              <span class="text-xl font-medium text-red-600">1:30</span>
            </div>
            <div>
              <span class="text-sm">temp</span> &nbsp
              <span class="text-xl font-medium text-red-600">10.3</span>
            </div>
            <div>
              <span class="text-sm">ratio</span> &nbsp
              <span class="text-xl font-medium text-red-600">30 %</span>
            </div>
          </div>
        </div>
        <div class="border bg-base-300 collapse collapse-arrow rounded mb-1 p-1 text-right">
          <input type="checkbox" class="min-h-0" checked />
          <p class="collapse-title p-0 min-h-0 text-sm font-bold">Maillard</p>
          <div class="collapse-content p-0 min-h-0 ">
            <div>
              <span class="text-sm">time</span> &nbsp
              <span class="text-xl font-medium text-red-600">1:30</span>
            </div>
            <div>
              <span class="text-sm">temp</span> &nbsp
              <span class="text-xl font-medium text-red-600">10.3</span>
            </div>
            <div>
              <span class="text-sm">ratio</span> &nbsp
              <span class="text-xl font-medium text-red-600">30 %</span>
            </div>
          </div>
        </div>
        <div class="border bg-base-300 collapse collapse-arrow rounded mb-1 p-1 text-right">
          <input type="checkbox" class="min-h-0" checked />
          <p class="collapse-title p-0 min-h-0 text-sm font-bold">Develop</p>
          <div class="collapse-content p-0 min-h-0 ">
            <div>
              <span class="text-sm">time</span> &nbsp
              <span class="text-xl font-medium text-red-600">1:30</span>
            </div>
            <div>
              <span class="text-sm">temp</span> &nbsp
              <span class="text-xl font-medium text-red-600">10.3</span>
            </div>
            <div>
              <span class="text-sm">ratio</span> &nbsp
              <span class="text-xl font-medium text-red-600">30 %</span>
            </div>
          </div>
        </div>
      </div>
      {/* sidebar end*/}
      {/* main start*/}
      <div class="col-start-2 col-end-3 row-start-2 row-end-3 bg-base-200 p-1">
        <LinePlot />

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
        <input
          type="range"
          min="0"
          max="100"
          value="40"
          class="range range-primary range-xs w-1/2 "
        />
        <input
          type="range"
          min="0"
          max="100"
          value="60"
          class="range range-secondary range-xs w-1/2 "
        />
        <input
          type="range"
          min="0"
          max="100"
          value="40"
          class="range range-primary range-xs w-1/2 "
        />
        <input
          type="range"
          min="0"
          max="100"
          value="60"
          class="range range-secondary range-xs w-1/2 "
        />
        <div>
          <button class="btn ">custom</button>
          <button class="btn ">custom</button>
          <button class="btn ">custom</button>
          <button class="btn ">custom</button>
          <button class="btn ">custom</button>
          <button class="btn ">custom</button>
          <button class="btn ">custom</button>
          <button class="btn ">custom</button>
          <button class="btn ">custom</button>
        </div>
        <div>
          <textarea
            placeholder="Logs"
            class="textarea textarea-bordered textarea-xs w-full max-w-lg"
          ></textarea>
        </div>

      </div>
      {/* main start*/}
    </div>
  );
}

export default App;
