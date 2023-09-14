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
    <div class="h-screen grid grid-cols-[200px_1fr] grid-rows-[60px_1fr] gap-1">
      {/* header start*/}
      <div class="col-start-1 col-end-3 row-start-1 row-end-2 bg-cyan-300 flex justify-end p-1">
        <button class="btn ">Reset</button>

        <button class="btn ">On</button>
        <button class="btn ">Start</button>
      </div>
      {/* header end*/}
      {/* sidebar start*/}
      <div class="col-start-1 col-end-2 row-start-2 row-end-3 bg-sky-300 overflow-y-auto p-1 ">
        <div class="collapse bg-base-200 my-1">
          <input type="checkbox" checked />
          <div class="collapse-title text-xl font-medium">BT</div>
          <div class="collapse-content">
            <p>195.1</p>
          </div>
        </div>
        <div class="collapse bg-base-200 my-1">
          <input type="checkbox" checked />
          <div class="collapse-title text-xl font-medium">ET</div>
          <div class="collapse-content">
            <p>195.1</p>
          </div>
        </div>
        <div class="collapse bg-base-200 my-1">
          <input type="checkbox" checked />
          <div class="collapse-title text-xl font-medium">inlet</div>
          <div class="collapse-content">
            <p>195.1</p>
          </div>
        </div>
        <div class="collapse bg-base-200 my-1">
          <input type="checkbox" checked />
          <div class="collapse-title text-xl font-medium">delta BT</div>
          <div class="collapse-content">
            <p>15.1</p>
          </div>
        </div>
        <div class="collapse bg-base-200 my-1">
          <input type="checkbox" checked />
          <div class="collapse-title text-xl font-medium">DRY %</div>
          <div class="collapse-content">
            <p>15.1</p>
          </div>
        </div>
        <div class="collapse bg-base-200 my-1">
          <input type="checkbox" checked />
          <div class="collapse-title text-xl font-medium">&gt&gt DRY</div>
          <div class="collapse-content">
            <p>15.1</p>
          </div>
        </div>
        <div class="collapse bg-base-200 my-1">
          <input type="checkbox" checked />
          <div class="collapse-title text-xl font-medium">&gt&gt FC</div>
          <div class="collapse-content">
            <p>15.1</p>
          </div>
        </div>
      </div>
      {/* sidebar end*/}
      {/* main start*/}
      <div class="col-start-2 col-end-3 row-start-2 row-end-3 bg-blue-200">
        <p>main</p>
        <LinePlot />

        <ul class="steps w-4/5 ">
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
