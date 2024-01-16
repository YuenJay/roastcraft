// SPDX-License-Identifier: GPL-3.0-or-later

import { For, createEffect, createSignal, onMount } from "solid-js";
import { SET, appStateSig } from "./AppState";
import { local } from "d3";

export default function NotesPanel(props: any) {

    const [appState, _setAppState] = appStateSig;

    createEffect(() => {

    });

    return (

        <div class="flex flex-col gap-1 ">

            <label for="title">Title</label>
            <div class="dropdown">
                <input id="title" placeholder="Type here" class="input input-bordered input-sm w-full"
                    onInput={(e) => {
                        appState().titleSig[SET](e.target.value);
                    }}
                    onChange={(e) => {
                        let recentTitles: Array<string> = JSON.parse(localStorage.getItem("recentTitles") || "[]");
                        recentTitles.push(e.target.value);
                        if (recentTitles.length > 5) {
                            recentTitles.shift();
                        }
                        localStorage.setItem("recentTitles", JSON.stringify(recentTitles));
                        console.log(localStorage.getItem("recentTitles"));
                    }}
                />
                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-full">
                    <li><a>Item 1</a></li>
                    <li><a>Item 2</a></li>
                </ul>
            </div>


            <div class="grid grid-cols-4 gap-1">
                <h1 class="col-span-1"></h1>
                <h1 class="col-span-1">Green</h1>
                <h1 class="col-span-1">Roasted</h1>
                <h1 class="col-span-1"></h1>

                <h1 class="col-span-1">Weight</h1>
                <input type="text" class="input input-bordered input-xs w-20" />
                <input type="text" class="input input-bordered input-xs w-20" />
                <h1 class="col-span-1">g</h1>

                <h1 class="col-span-1">Volume</h1>
                <input type="text" class="input input-bordered input-xs w-20" />
                <input type="text" class="input input-bordered input-xs w-20" />
                <h1 class="col-span-1">ml</h1>

                <h1 class="col-span-1">Density</h1>
                <input type="text" class="input input-bordered input-xs w-20" />
                <input type="text" class="input input-bordered input-xs w-20" />
                <h1 class="col-span-1">g/ml</h1>

                <h1 class="col-span-1">Moisture</h1>
                <input type="text" class="input input-bordered input-xs w-20" />
                <input type="text" class="input input-bordered input-xs w-20" />
                <h1 class="col-span-1">%</h1>
            </div>
            <div class="w-full border-b-2 my-2"></div>
            <div class="grid grid-cols-4 gap-1">
                <h1 class="col-span-1"></h1>
                <h1 class="col-span-1">Whole</h1>
                <h1 class="col-span-1">Ground</h1>
                <h1 class="col-span-1"></h1>

                <h1 class="col-span-1">Color</h1>
                <input type="text" class="input input-bordered input-xs w-20" />
                <input type="text" class="input input-bordered input-xs w-20" />
                <h1 class="col-span-1">agtron</h1>
            </div>
            <div class="w-full border-b-2 my-2"></div>
            <textarea class="textarea textarea-bordered textarea-xs w-full h-36" placeholder="Roast Notes"></textarea>

            <textarea class="textarea textarea-bordered textarea-xs w-full h-36" placeholder="Cupping Notes"></textarea>

        </div>
    )
}