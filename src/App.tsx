import { createSignal, onMount, onCleanup } from "solid-js";
import { createStore, produce } from 'solid-js/store'
import { invoke } from "@tauri-apps/api/tauri";
import { trace, info, error, attachConsole } from "tauri-plugin-log-api";
import { UnlistenFn, emit, listen } from "@tauri-apps/api/event";
import * as d3 from "d3";

function App() {

  const [appState, setAppState] = createStore({
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

      setAppState({ BT: event.payload.bean_temp as number });

      let input = { "timestamp": appState.timer, "value": event.payload.bean_temp };

      // localized mutation
      setAppState(
        produce((appState) => {
          appState.metrics[0].data.push(input)
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
    trace("buttonOnClicked");
  }

  async function buttonOffClicked() {
    await invoke("button_off_clicked");
    trace("buttonOffClicked");
  }

  async function buttonStartClicked() {
    trace("buttonStartClicked");
    // allow only 1 setInterval running
    if (intervalId == 0) {
      intervalId = setInterval(() => {
        setAppState({ timer: appState.timer + 1 });
      }, 1000);
    }
  }

  async function buttonStopClicked() {
    trace("buttonStopClicked");
    clearInterval(intervalId);
    intervalId = 0;
  }

  function LinePlot({
    data = appState.metrics[0].data,
    width = 800,
    height = 400,
    marginTop = 20,
    marginRight = 20,
    marginBottom = 20,
    marginLeft = 20,
  }) {
    const x = d3.scaleLinear(
      [0, 600],
      [marginLeft, width - marginRight]
    );
    const y = d3.scaleLinear([0, 300], [
      height - marginBottom,
      marginTop,
    ]);

    const line = d3.line()
      .x((d: any) => x(d.timestamp))
      .y((d: any) => y(d.value));

    return (
      <svg width={width} height={height}>
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          d={line(data) as string | undefined}
        />
        <g fill="white" stroke="currentColor" stroke-width="1">
          {data.map((d: any) => (
            <circle cx={x(d.timestamp)} cy={y(d.value)} r="2" />
          ))}
        </g>
      </svg>
    );
  }

  return (
    <div class="h-screen grid grid-cols-[140px_1fr] grid-rows-[60px_1fr] ">
      {/* header start*/}
      <div class="col-start-1 col-end-3 row-start-1 row-end-2 flex justify-end items-center">
        <button class="btn btn-accent mr-2">reset</button>

        <button class="btn btn-accent mr-2" onClick={buttonOnClicked}>on</button>
        <button class="btn btn-accent mr-2" onClick={buttonOffClicked}>off</button>
        <button class="btn btn-accent mr-2" onClick={buttonStartClicked}>start</button>
        <button class="btn btn-accent mr-2" onClick={buttonStopClicked}>stop</button>
      </div>
      {/* header end*/}
      {/* sidebar start*/}
      <div class="col-start-1 col-end-2 row-start-2 row-end-3 overflow-y-auto px-1">
        <div class="border bg-black rounded mb-1 py-2 text-center sticky top-0">
          <p class="text-4xl font-extrabold  text-white">
            {Math.floor(appState.timer / 60).toString().padStart(2, '0') + ":" + (appState.timer % 60).toString().padStart(2, '0')}
          </p>
        </div>
        <div class="border bg-base-300 rounded mb-1 p-1 text-right ">
          <p>BT</p>
          <p class="text-2xl font-medium text-red-600">{appState.BT}</p>
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
