import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { trace, info, error, attachConsole } from "tauri-plugin-log-api";
import * as d3 from "d3";

function App() {
  const [greetMsg, setGreetMsg] = createSignal("");
  const [name, setName] = createSignal("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name: name() }));
  }

  async function buttonOnClicked() {
    trace("buttonOnClicked");
    await invoke("button_on_clicked");
    
  }

  function LinePlot({
    data = [1, 2, 3, 4],
    width = 800,
    height = 400,
    marginTop = 20,
    marginRight = 20,
    marginBottom = 20,
    marginLeft = 20,
  }) {
    const x = d3.scaleLinear(
      [0, data.length - 1],
      [marginLeft, width - marginRight]
    );
    const y = d3.scaleLinear(d3.extent(data) as [number, number], [
      height - marginBottom,
      marginTop,
    ]);
    const line = d3.line((_d, i) => x(i), y);
    return (
      <svg width={width} height={height}>
        <path
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          d={line(data) as string | undefined}
        />
        <g fill="white" stroke="currentColor" stroke-width="1.5">
          {data.map((d, i) => (
            <circle cx={x(i)} cy={y(d)} r="2.5" />
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

        <button class="btn btn-accent mr-2" onClick={buttonOnClicked}>
          on
        </button>
        <button class="btn btn-accent mr-2">start</button>
      </div>
      {/* header end*/}
      {/* sidebar start*/}
      <div class="col-start-1 col-end-2 row-start-2 row-end-3 overflow-y-auto px-1">
        <div class="border bg-black rounded mb-1 py-2 text-center sticky top-0">
          <p class="text-4xl font-extrabold  text-white">08:45</p>
        </div>
        <div class="border bg-base-300 rounded mb-1 p-1 text-right ">
          <p>BT</p>
          <p class="text-2xl font-medium text-red-600">195.1</p>
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

        <form
          class="row"
          onSubmit={(e) => {
            e.preventDefault();
            greet();
          }}
        >
          <input
            id="greet-input"
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Enter a name..."
          />
          <button type="submit">Greet</button>
        </form>

        <p>{greetMsg()}</p>
      </div>
      {/* main start*/}
    </div>
  );
}

export default App;
