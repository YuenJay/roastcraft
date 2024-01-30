// SPDX-License-Identifier: GPL-3.0-or-later

import { For, Show, createEffect, createSignal } from "solid-js";
import { GET, SET, appStateSig } from "./AppState";
import { loadGreenBeanInfo } from "./fileUtil";

function agtronLevel(agtron: number) {
    if (agtron < 20) return "Over Developed";
    if (agtron < 30) return "Extremely Dark";
    if (agtron < 40) return "Dark";
    if (agtron < 50) return "Medium Dark";
    if (agtron < 60) return "Meduim";
    if (agtron < 70) return "Medium Light";
    if (agtron < 80) return "Light";
    if (agtron < 90) return "Very Light";
    if (agtron < 100) return "Extremely Light";
    return "Under Developed"
}

export default function NotesPanel() {

    const [appState, _setAppState] = appStateSig;
    const [weightGreen, setWeightGreen] = appState().weightGreenSig;
    const [weightRoasted, setWeightRoasted] = appState().weightRoastedSig
    const [volumeGreen, setVolumeGreen] = appState().volumeGreenSig;
    const [volumeRoasted, setVolumeRoasted] = appState().volumeRoastedSig;
    const [densityGreen, setDensityGreen] = appState().densityGreenSig;
    const [densityRoasted, setDensityRoasted] = appState().densityRoastedSig;
    const [moistureGreen, setMoistureGreen] = appState().moistureGreenSig;
    const [moistureRoasted, setMoistureRoasted] = appState().moistureRoastedSig;
    const [colorWhole, setColorWhole] = appState().colorWholeSig;
    const [colorGround, setColorGround] = appState().colorGroundSig;

    const [recentTitles, setRecentTitles] = createSignal(JSON.parse(localStorage.getItem("recentTitles") || "[]") as Array<string>);
    const [recentCountries, setRecentCountries] = createSignal(JSON.parse(localStorage.getItem("recentCountries") || "[]") as Array<string>);
    const [recentProcesses, setRecentProcesses] = createSignal(JSON.parse(localStorage.getItem("recentProcesses") || "[]") as Array<string>);

    function updateFlavorList() {
        let result = new Array<string>();
        findFlavor(appState().flavorWheelSig[GET](), result);
        appState().flavorListSig[SET](result);
    }

    function findFlavor(f: any, result: Array<string>) {
        if (f.checked == true) {
            result.push(f.name);
        }
        if (f.children != undefined) {
            f.children.forEach(
                (element: any) => {
                    findFlavor(element, result);
                }
            );
        }
    }

    createEffect(() => {

    });

    return (

        <div class="flex flex-col gap-1 text-sm">
            <div class="flex flex-row gap-1">
                <div class="basis-4/5 flex flex-col " >
                    <label class="">Title</label>
                    <div class="dropdown ">
                        <input id="title" class="input input-bordered input-sm rounded w-full"
                            value={appState().titleSig[GET]()}
                            onKeyDown={(e: KeyboardEvent) => {
                                if (e.key === "Enter") {
                                    (e.target as HTMLInputElement).blur();
                                }
                            }}
                            onInput={(e: InputEvent) => {
                                appState().titleSig[SET]((e.target as HTMLInputElement).value);
                            }}
                            onChange={(e) => {

                                let r = recentTitles();
                                while (r.length > 4) {
                                    r.shift();
                                }
                                setRecentTitles([...r, e.target.value]);

                                localStorage.setItem("recentTitles", JSON.stringify(recentTitles()));
                            }}
                        />
                        <ul tabindex="0" class="dropdown-content z-[1] menu shadow bg-base-100 w-full">
                            <For each={[...recentTitles()].reverse()}>
                                {(t) => (
                                    <li>
                                        <a onClick={(e) => {
                                            e.preventDefault();
                                            appState().titleSig[SET](t);
                                            (document.activeElement as HTMLElement).blur();
                                        }}>{t}</a>
                                    </li>
                                )}
                            </For>
                        </ul>
                    </div>
                </div>

                <button class="basis-1/5 btn btn-sm btn-accent rounded place-self-end"
                    onClick={() => loadGreenBeanInfo()}
                >LOAD</button>
            </div>
            <div class="flex flex-row gap-1">
                <div class="basis-1/2 flex flex-col " >
                    <label class="">Country</label>
                    <div class="dropdown ">
                        <input id="title" class="input input-bordered input-sm rounded w-full"
                            value={appState().countrySig[GET]()}
                            onKeyDown={(e: KeyboardEvent) => {
                                if (e.key === "Enter") {
                                    (e.target as HTMLInputElement).blur();
                                }
                            }}
                            onInput={(e: InputEvent) => {
                                appState().countrySig[SET]((e.target as HTMLInputElement).value);
                            }}
                            onChange={(e) => {

                                let r = recentCountries();
                                while (r.length > 4) {
                                    r.shift();
                                }
                                setRecentCountries([...r, e.target.value]);

                                localStorage.setItem("recentCountries", JSON.stringify(recentCountries()));
                            }}
                        />
                        <ul tabindex="0" class="dropdown-content z-[1] menu shadow bg-base-100 w-full">
                            <For each={[...recentCountries()].reverse()}>
                                {(c) => (
                                    <li>
                                        <a onClick={(e) => {
                                            e.preventDefault();
                                            appState().countrySig[SET](c);
                                            (document.activeElement as HTMLElement).blur();
                                        }}>{c}</a>
                                    </li>
                                )}
                            </For>
                        </ul>
                    </div>
                </div>
                <div class="basis-1/2 flex flex-col " >
                    <label class="">Process</label>
                    <div class="dropdown ">
                        <input id="title" class="input input-bordered input-sm rounded w-full"
                            value={appState().processSig[GET]()}
                            onKeyDown={(e: KeyboardEvent) => {
                                if (e.key === "Enter") {
                                    (e.target as HTMLInputElement).blur();
                                }
                            }}
                            onInput={(e: InputEvent) => {
                                appState().processSig[SET]((e.target as HTMLInputElement).value);
                            }}
                            onChange={(e) => {

                                let r = recentProcesses();
                                while (r.length > 4) {
                                    r.shift();
                                }
                                setRecentProcesses([...r, e.target.value]);

                                localStorage.setItem("recentProcesses", JSON.stringify(recentProcesses()));
                            }}
                        />
                        <ul tabindex="0" class="dropdown-content z-[1] menu shadow bg-base-100 w-full">
                            <For each={[...recentProcesses()].reverse()}>
                                {(p) => (
                                    <li>
                                        <a onClick={(e) => {
                                            e.preventDefault();
                                            appState().processSig[SET](p);
                                            (document.activeElement as HTMLElement).blur();
                                        }}>{p}</a>
                                    </li>
                                )}
                            </For>

                        </ul>

                    </div>
                </div>
            </div>
            <div class="flex flex-col" >
                <label>Notes</label>
                <textarea class="textarea textarea-bordered textarea-xs w-full rounded h-36"
                    value={appState().notesSig[GET]()}
                    onChange={(e) => {
                        appState().notesSig[SET](e.target.value);
                    }}
                ></textarea>
            </div>

            <div class="grid grid-cols-5 gap-1">
                <h1 class="col-span-1"></h1>
                <h1 class="col-span-1">Green</h1>
                <h1 class="col-span-1">Roasted</h1>
                <h1 class="col-span-1"></h1>
                <h1 class="col-span-1"></h1>

                <h1 class="col-span-1">Weight</h1>
                <input type="text" class="input input-bordered input-xs text-right rounded w-16"
                    value={weightGreen()}
                    onChange={(e) => {
                        setWeightGreen(parseFloat(e.target.value));
                        if (weightGreen() != 0 && volumeGreen() != 0) {
                            setDensityGreen(1000 * weightGreen() / volumeGreen());
                        }
                    }}
                />
                <input type="text" class="input input-bordered input-xs text-right rounded w-16"
                    value={weightRoasted()}
                    onChange={(e) => {
                        setWeightRoasted(parseFloat(e.target.value));
                        if (weightRoasted() != 0 && volumeRoasted() != 0) {
                            setDensityRoasted(1000 * weightRoasted() / volumeRoasted());
                        }
                    }}
                />
                <h1 class="col-span-1">g</h1>
                <Show when={weightGreen() != 0 && weightRoasted() != 0}
                    fallback={
                        <h1 class="col-span-1"></h1>
                    }
                >
                    <h1 class="col-span-1">{((weightRoasted() - weightGreen()) * 100 / weightGreen()).toFixed(1)}%</h1>
                </Show>


                <h1 class="col-span-1">Volume</h1>
                <input type="text" class="input input-bordered input-xs text-right rounded w-16"
                    value={volumeGreen()}
                    onChange={(e) => {
                        setVolumeGreen(parseFloat(e.target.value));
                        if (weightGreen() != 0 && volumeGreen() != 0) {
                            setDensityGreen(1000 * weightGreen() / volumeGreen());
                        }
                    }}
                />
                <input type="text" class="input input-bordered input-xs text-right rounded w-16"
                    value={volumeRoasted()}
                    onChange={(e) => {
                        setVolumeRoasted(parseFloat(e.target.value));
                        if (weightRoasted() != 0 && volumeRoasted() != 0) {
                            setDensityRoasted(1000 * weightRoasted() / volumeRoasted());
                        }
                    }}
                />
                <h1 class="col-span-1">ml</h1>
                <Show when={volumeGreen() != 0 && volumeRoasted() != 0}
                    fallback={
                        <h1 class="col-span-1"></h1>
                    }
                >
                    <h1 class="col-span-1">{((volumeRoasted() - volumeGreen()) * 100 / volumeGreen()).toFixed(1)}%</h1>
                </Show>

                <h1 class="col-span-1">Density</h1>
                <input type="text" class="input input-bordered input-xs text-right rounded w-16"
                    value={densityGreen()}
                    onChange={(e) => {
                        setDensityGreen(parseFloat(e.target.value));
                        if (weightGreen() != 0 && densityGreen() != 0) {
                            setVolumeGreen(weightGreen() / densityGreen());
                        }
                    }}
                />
                <input type="text" class="input input-bordered input-xs text-right rounded w-16"
                    value={densityRoasted()}
                    onChange={(e) => {
                        setDensityRoasted(parseFloat(e.target.value));
                        if (weightRoasted() != 0 && densityRoasted() != 0) {
                            setVolumeRoasted(weightRoasted() / densityRoasted());
                        }
                    }}
                />
                <h1 class="col-span-1">g/l</h1>
                <Show when={densityGreen() != 0 && densityRoasted() != 0}
                    fallback={
                        <h1 class="col-span-1"></h1>
                    }
                >
                    <h1 class="col-span-1">{((densityRoasted() - densityGreen()) * 100 / densityGreen()).toFixed(1)}%</h1>
                </Show>

                <h1 class="col-span-1">Moisture</h1>
                <input type="text" class="input input-bordered input-xs text-right rounded w-16"
                    value={moistureGreen()}
                    onChange={(e) => {
                        setMoistureGreen(parseFloat(e.target.value));
                    }}
                />
                <input type="text" class="input input-bordered input-xs text-right rounded w-16"
                    value={moistureRoasted()}
                    onChange={(e) => {
                        setMoistureRoasted(parseFloat(e.target.value));
                    }}
                />
                <h1 class="col-span-1">%</h1>
                <Show when={moistureGreen() != 0 && moistureRoasted() != 0}
                    fallback={
                        <h1 class="col-span-1"></h1>
                    }
                >
                    <h1 class="col-span-1">{moistureRoasted() - moistureGreen()}</h1>
                </Show>
            </div>
            <div class="w-full border-b-2 my-2"></div>
            <div class="grid grid-cols-5 gap-1">
                <h1 class="col-span-1"></h1>
                <h1 class="col-span-1">Whole</h1>
                <h1 class="col-span-1">Ground</h1>
                <h1 class="col-span-1"></h1>
                <h1 class="col-span-1"></h1>

                <h1 class="col-span-1">Color</h1>
                <input type="text" class="input input-bordered input-xs text-right rounded w-16"
                    value={colorWhole()}
                    onChange={(e) => {
                        setColorWhole(parseFloat(e.target.value));
                    }}
                />
                <input type="text" class="input input-bordered input-xs text-right rounded w-16"
                    value={colorGround()}
                    onChange={(e) => {
                        setColorGround(parseFloat(e.target.value));
                    }}
                />
                <h1 class="col-span-1">agtron</h1>
                <Show when={colorWhole() != 0 && colorGround() != 0}
                    fallback={
                        <h1 class="col-span-1"></h1>
                    }
                >
                    <h1 class="col-span-1">{colorGround() - colorWhole()}</h1>
                </Show>
                <h1 class="col-span-1"></h1>
                <h1 class="col-span-1 text-xs">{colorWhole() > 0 ? agtronLevel(colorWhole()) : ""}</h1>
                <h1 class="col-span-1 text-xs">{colorGround() > 0 ? agtronLevel(colorGround()) : ""}</h1>
                <h1 class="col-span-1"></h1>
                <h1 class="col-span-1"></h1>
            </div>
            <div class="w-full border-b-2 my-2"></div>
            <Show when={appState().flavorListSig[GET]().length > 0}
                fallback={<div class="">
                    &nbsp;
                </div>}
            >
                <div class="">
                    <span>{appState().flavorListSig[GET]().join(", ")}</span>
                </div>
            </Show>
            <For each={appState().flavorWheelSig[GET]().children}>
                {(f) => (
                    <details open={false}>
                        <summary class="space-x-1">
                            <input type="checkbox"
                                checked={f.checked}
                                onChange={(event) => {
                                    f.checked = event.currentTarget.checked;
                                    updateFlavorList();
                                }}
                            />
                            <span>{f.name}</span>
                        </summary>
                        <div class="pl-4">
                            <For each={f.children}>
                                {(ff) => (
                                    <Show when={ff.children != undefined}
                                        fallback={
                                            <div class="pl-4 space-x-1">
                                                <input type="checkbox"
                                                    checked={ff.checked}
                                                    onChange={(event) => {
                                                        ff.checked = event.currentTarget.checked;
                                                        updateFlavorList();
                                                    }}
                                                />
                                                <span>{ff.name}</span>
                                            </div>
                                        }
                                    >
                                        <details >
                                            <summary class="space-x-1">
                                                <input type="checkbox"
                                                    checked={ff.checked}
                                                    onChange={(event) => {
                                                        ff.checked = event.currentTarget.checked;
                                                        updateFlavorList();
                                                    }}
                                                />
                                                <span>{ff.name}</span>
                                            </summary>
                                            <div class="pl-4">
                                                <For each={ff.children}>
                                                    {(fff) => (
                                                        <div class="pl-4 space-x-1">
                                                            <input type="checkbox"
                                                                checked={fff.checked}
                                                                onChange={(event) => {
                                                                    fff.checked = event.currentTarget.checked;
                                                                    updateFlavorList();
                                                                }}
                                                            />
                                                            <span>{fff.name}</span>
                                                        </div>
                                                    )}
                                                </For>
                                            </div>
                                        </details>
                                    </Show>
                                )}
                            </For>
                        </div>
                    </details>
                )}
            </For>
        </div>
    )
}