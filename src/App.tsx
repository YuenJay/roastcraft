import { createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import * as d3 from "d3";

function App() {
  const [greetMsg, setGreetMsg] = createSignal("");
  const [name, setName] = createSignal("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name: name() }));
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
    <div class="h-screen grid grid-cols-[160px_1fr] grid-rows-[60px_1fr] ">
      {/* header start*/}
      <div class="col-start-1 col-end-3 row-start-1 row-end-2 bg-cyan-300 flex justify-end p-1">
        <button class="btn ">Reset</button>

        <button class="btn ">On</button>
        <button class="btn ">Start</button>
      </div>
      {/* header end*/}
      {/* sidebar start*/}
      <div class="col-start-1 col-end-2 row-start-2 row-end-3 bg-sky-300 overflow-y-auto p-1 ">
        <div class="bg-base-200 rounded mb-1 p-1 text-center bg-black">
          <p class="text-4xl font-extrabold  text-white">08:45</p>
        </div>
        <div class="bg-base-200 rounded mb-1 p-1 text-right">
          <p>BT</p>
          <p class="text-2xl font-medium text-red-600">195.1</p>
        </div>
        <div class="bg-base-200 rounded mb-1 p-1 text-right">
          <p>Δ BT</p>
          <p class="text-2xl font-medium text-green-600">15.4</p>
        </div>

        <div class="bg-base-200 rounded mb-1 p-1 text-right">
          <p>ET</p>
          <p class="text-2xl font-medium text-red-600">205.2</p>
        </div>
        <div class="bg-base-200 rounded mb-1 p-1 text-right">
          <p>inlet</p>
          <p class="text-2xl font-medium text-red-600">350.3</p>
        </div>

        <div class="collapse collapse-arrow rounded bg-base-300 mb-1 p-1 text-right">
          <input type="checkbox" class="min-h-0" checked />
          <p class="collapse-title p-0 min-h-0">DRY %</p>
          <p class="collapse-content p-0 min-h-0 text-2xl font-medium text-red-600">
            15.1
          </p>
        </div>
        <div class="collapse collapse-arrow rounded bg-base-300 mb-1 p-1 text-right">
          <input type="checkbox" class="min-h-0" />
          <p class="collapse-title p-0 min-h-0">RAMP %</p>
          <p class="collapse-content p-0 min-h-0 text-2xl font-medium text-red-600">
            15.1
          </p>
        </div>
        <div class="collapse collapse-arrow rounded bg-base-300 mb-1 p-1 text-right">
          <input type="checkbox" class="min-h-0" />
          <p class="collapse-title p-0 min-h-0">DEV %</p>
          <p class="collapse-content p-0 min-h-0 text-2xl font-medium text-red-600">
            15.1
          </p>
        </div>
      </div>
      {/* sidebar end*/}
      {/* main start*/}
      <div class="col-start-2 col-end-3 row-start-2 row-end-3 bg-blue-200">
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
            class="textarea textarea-bordered textarea-xs w-full max-w-md"
          ></textarea>
        </div>
        {/*         
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

        <p>{greetMsg()}</p> */}
      </div>
      {/* main start*/}
    </div>
  );
}

export default App;
