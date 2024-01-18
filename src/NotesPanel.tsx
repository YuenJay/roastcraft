// SPDX-License-Identifier: GPL-3.0-or-later

import { For, createEffect, createSignal } from "solid-js";
import { GET, SET, appStateSig } from "./AppState";

export default function NotesPanel(props: any) {

    const [appState, _setAppState] = appStateSig;

    const [recentTitles, setRecentTitles] = createSignal(JSON.parse(localStorage.getItem("recentTitles") || "[]") as Array<string>);

    let flavor = [
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
                    name: "Alcohol/Fermented",
                    checked: false,
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
                    name: "Dried Fruit",
                    checked: false,
                    children: [
                        { name: "Raisin", checked: false, },
                        { name: "Prune", checked: false, },

                    ]
                }
            ]
        }
    ]

    createEffect(() => {

    });

    return (

        <div class="flex flex-col gap-1 ">
            <div class="flex flex-col" >
                <label>Title</label>
                <div class="dropdown">
                    <input id="title" class="input input-bordered input-sm w-full"
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
                            console.log(localStorage.getItem("recentTitles"));
                        }}
                    />
                    <ul tabindex="0" class="dropdown-content z-[1] menu shadow bg-base-100 w-full">
                        <For each={[...recentTitles()].reverse()}>
                            {(title) => (
                                <li>
                                    <a onClick={(e) => {
                                        e.preventDefault();
                                        appState().titleSig[SET](title);
                                        (document.activeElement as HTMLElement).blur();
                                    }}>{title}</a>
                                </li>
                            )}
                        </For>

                    </ul>
                </div>
            </div>


            <div class="grid grid-cols-5 gap-1">
                <h1 class="col-span-1"></h1>
                <h1 class="col-span-1">Green</h1>
                <h1 class="col-span-1">Roasted</h1>
                <h1 class="col-span-1"></h1>
                <h1 class="col-span-1"></h1>

                <h1 class="col-span-1">Weight</h1>
                <input type="text" class="input input-bordered input-xs w-16" />
                <input type="text" class="input input-bordered input-xs w-16" />
                <h1 class="col-span-1">g</h1>
                <h1 class="col-span-1">-10%</h1>

                <h1 class="col-span-1">Volume</h1>
                <input type="text" class="input input-bordered input-xs w-16" />
                <input type="text" class="input input-bordered input-xs w-16" />
                <h1 class="col-span-1">ml</h1>
                <h1 class="col-span-1"></h1>

                <h1 class="col-span-1">Density</h1>
                <input type="text" class="input input-bordered input-xs w-16" />
                <input type="text" class="input input-bordered input-xs w-16" />
                <h1 class="col-span-1">g/ml</h1>
                <h1 class="col-span-1"></h1>

                <h1 class="col-span-1">Moisture</h1>
                <input type="text" class="input input-bordered input-xs w-16" />
                <input type="text" class="input input-bordered input-xs w-16" />
                <h1 class="col-span-1">%</h1>
                <h1 class="col-span-1"></h1>
            </div>
            <div class="w-full border-b-2 my-2"></div>
            <div class="grid grid-cols-5 gap-1">
                <h1 class="col-span-1"></h1>
                <h1 class="col-span-1">Whole</h1>
                <h1 class="col-span-1">Ground</h1>
                <h1 class="col-span-1"></h1>
                <h1 class="col-span-1"></h1>

                <h1 class="col-span-1">Color</h1>
                <input type="text" class="input input-bordered input-xs w-16" />
                <input type="text" class="input input-bordered input-xs w-16" />
                <h1 class="col-span-1">agtron</h1>
                <h1 class="col-span-1">-10</h1>
            </div>
            <div class="w-full border-b-2 my-2"></div>
            <textarea class="textarea textarea-bordered textarea-xs w-full h-36" placeholder="Roast Notes"></textarea>

            <textarea class="textarea textarea-bordered textarea-xs w-full h-36" placeholder="Cupping Notes"></textarea>

            <For each={flavor}>
                {(f) => (
                    <>
                        <details open={false}>
                            <summary class="space-x-1">
                                <input type="checkbox" />
                                <span>{f.name}</span>
                            </summary>
                            <div class="pl-4">
                                <For each={f.children}>
                                    {(ff) => (
                                        <>
                                            <details >
                                                <summary class="space-x-1">
                                                    <input type="checkbox" />
                                                    <span>{ff.name}</span>
                                                </summary>
                                                <div class="pl-4">
                                                    <For each={ff.children}>
                                                        {(fff) => (
                                                            <>
                                                                <div class="pl-4 space-x-1">
                                                                    <input type="checkbox" />
                                                                    <span>{fff.name}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </For>
                                                </div>
                                            </details>
                                        </>
                                    )}
                                </For>
                            </div>
                        </details>
                    </>
                )}
            </For>





        </div>
    )
}