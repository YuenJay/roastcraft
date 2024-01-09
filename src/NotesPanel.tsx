// SPDX-License-Identifier: GPL-3.0-or-later

import { createEffect, createSignal, onMount } from "solid-js";

export default function NotesPanel(props: any) {

    createEffect(() => {

    });

    return (

        <div class="flex flex-wrap gap-1">
            <label class="form-control w-full">
                <div class="label p-0">
                    <span class="label-text">Title</span>
                </div>
                <input type="text" placeholder="Type here" class="input input-bordered input-sm w-full " />
            </label>

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