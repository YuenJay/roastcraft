// SPDX-License-Identifier: GPL-3.0-or-later

import { For, createEffect, createSignal } from "solid-js";
import { GET, SET, appStateSig } from "./AppState";

export default function NotesPanel(props: any) {

    const [appState, _setAppState] = appStateSig;

    const [recentTitles, setRecentTitles] = createSignal(JSON.parse(localStorage.getItem("recentTitles") || "[]") as Array<string>);

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

        </div>
    )
}