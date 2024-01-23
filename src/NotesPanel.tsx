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

    let flavor = [
        {
            name: "Green/Vegetative", checked: false,
            children: [
                { name: "Olive Oil", checked: false, },
                { name: "Raw", checked: false, },
                { name: "Beany", checked: false, },
                {
                    name: "Green/Vegetative", checked: false,
                    children: [
                        { name: "Under-Ripe", checked: false, },
                        { name: "Peapod", checked: false, },
                        { name: "Fresh", checked: false, },
                        { name: "Dark Green", checked: false, },
                        { name: "Vegetative", checked: false, },
                        { name: "Hay-Like", checked: false, },
                        { name: "Herb-Like", checked: false, },
                    ]
                }
            ]
        },
        {
            name: "Sour/Fermented", checked: false,
            children: [
                {
                    name: "Sour", checked: false,
                    children: [
                        { name: "Sour Aromatics", checked: false, },
                        { name: "Acetic Acid", checked: false, },
                        { name: "Butyric Acid", checked: false, },
                        { name: "Isovaleric Acid", checked: false, },
                        { name: "Citric Acid", checked: false, },
                        { name: "Malic Acid", checked: false, },
                    ]
                },
                {
                    name: "Alcohol/Fermented", checked: false,
                    children: [
                        { name: "Winey", checked: false, },
                        { name: "Whiskey", checked: false, },
                        { name: "Fermented", checked: false, },
                        { name: "Overripe", checked: false, },
                    ]
                }
            ]
        },
        {
            name: "Fruity", checked: false,
            children: [
                {
                    name: "Berry", checked: false,
                    children: [
                        { name: "Blackberry", checked: false, },
                        { name: "Raspberry", checked: false, },
                        { name: "Blueberry", checked: false, },
                        { name: "Strawberry", checked: false, },
                    ]
                },
                {
                    name: "Dried Fruit", checked: false,
                    children: [
                        { name: "Raisin", checked: false, },
                        { name: "Prune", checked: false, },
                    ]
                }
            ]
        },
        {
            name: "Floral", checked: false,
            children: [
                { name: "Black Tea", checked: false, },
                {
                    name: "Floral", checked: false,
                    children: [
                        { name: "Chamomile", checked: false, },
                        { name: "Rose", checked: false, },
                        { name: "Jasmine", checked: false, },
                    ]
                }
            ]
        },
        {
            name: "Sweet", checked: false,
            children: [
                { name: "Sweet Aromatics", checked: false, },
                { name: "Overall Sweet", checked: false, },
                { name: "Vanillin", checked: false, },
                { name: "Vanilla", checked: false, },
                {
                    name: "Brown Sugar", checked: false,
                    children: [
                        { name: "Honey", checked: false, },
                        { name: "Caramelized", checked: false, },
                        { name: "Maple Syrup", checked: false, },
                        { name: "Molasses", checked: false, },
                    ]
                }
            ]
        },
        {
            name: "Nutty/Cocoa", checked: false,
            children: [
                {
                    name: "Nutty", checked: false,
                    children: [
                        { name: "Almond", checked: false, },
                        { name: "Hazelnut", checked: false, },
                        { name: "Peanuts", checked: false, },
                    ]
                },
                {
                    name: "Cocoa", checked: false,
                    children: [
                        { name: "Dark Chocolate", checked: false, },
                        { name: "Chocolate", checked: false, },
                    ]
                }
            ]
        },
        {
            name: "Spices", checked: false,
            children: [
                { name: "Pepper", checked: false, },
                { name: "Pungent", checked: false, },
                {
                    name: "Brown Spice", checked: false,
                    children: [
                        { name: "Clove", checked: false, },
                        { name: "Cinnamon", checked: false, },
                        { name: "Nutmeg", checked: false, },
                        { name: "Anise", checked: false, },
                    ]
                },
            ]
        },
        {
            name: "Roasted", checked: false,
            children: [
                { name: "Tobacco", checked: false, },
                { name: "Pipe Tobacco", checked: false, },
                {
                    name: "Cereal", checked: false,
                    children: [
                        { name: "Malt", checked: false, },
                        { name: "Grain", checked: false, },
                    ]
                },
                {
                    name: "Burnt", checked: false,
                    children: [
                        { name: "Brown, Roast", checked: false, },
                        { name: "Smoky", checked: false, },
                        { name: "Ashy", checked: false, },
                        { name: "Acrid", checked: false, },
                    ]
                },
            ]
        },
        {
            name: "Other", checked: false,
            children: [
                {
                    name: "Papery/Musty", checked: false,
                    children: [
                        { name: "Phenolic", checked: false, },
                        { name: "Meaty Brothy", checked: false, },
                        { name: "Animalic", checked: false, },
                        { name: "Musty/Earthy", checked: false, },
                        { name: "Musty/Dusty", checked: false, },
                        { name: "Moldy/Damp", checked: false, },
                        { name: "Woody", checked: false, },
                        { name: "Papery", checked: false, },
                        { name: "Cardboard", checked: false, },
                        { name: "Stale", checked: false, },
                    ]
                },
                {
                    name: "Chemical", checked: false,
                    children: [
                        { name: "Rubber", checked: false, },
                        { name: "Skunky", checked: false, },
                        { name: "Petroleum", checked: false, },
                        { name: "Medicinal", checked: false, },
                        { name: "Salty", checked: false, },
                        { name: "Bitter", checked: false, },
                    ]
                }
            ]
        },
    ]

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
                <h1 class="col-span-1  text-xs">{colorGround() > 0 ? agtronLevel(colorGround()) : ""}</h1>
                <h1 class="col-span-1"></h1>
                <h1 class="col-span-1"></h1>
            </div>
            <div class="w-full border-b-2 my-2"></div>



            <For each={flavor}>
                {(f) => (
                    <details open={false}>
                        <summary class="space-x-1">
                            <input type="checkbox" />
                            <span>{f.name}</span>
                        </summary>
                        <div class="pl-4">
                            <For each={f.children}>
                                {(ff) => (
                                    <Show when={ff.children != undefined}
                                        fallback={
                                            <div class="pl-4 space-x-1">
                                                <input type="checkbox" />
                                                <span>{ff.name}</span>
                                            </div>
                                        }
                                    >
                                        <details >
                                            <summary class="space-x-1">
                                                <input type="checkbox" />
                                                <span>{ff.name}</span>
                                            </summary>
                                            <div class="pl-4">
                                                <For each={ff.children}>
                                                    {(fff) => (
                                                        <div class="pl-4 space-x-1">
                                                            <input type="checkbox" />
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