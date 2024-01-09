// SPDX-License-Identifier: GPL-3.0-or-later

import { createEffect, createSignal, onMount } from "solid-js";

export default function NotesPanel(props: any) {

    createEffect(() => {

    });

    return (
        <>
            <div>
                <label class="form-control w-full">
                    <div class="label p-0">
                        <span class="label-text">Title</span>
                    </div>
                    <input type="text" placeholder="Type here" class="input input-bordered input-sm w-full " />
                </label>
                <label class="form-control w-20">
                    <div class="label p-0">
                        <span class="label-text">Weight</span>
                    </div>
                    <input type="text" class="input input-bordered input-sm w-full " />
                </label>
                <label class="form-control w-20">
                    <div class="label p-0">
                        <span class="label-text">Weight</span>
                    </div>
                    <input type="text" class="input input-bordered input-sm w-full " />
                </label>
                <label class="form-control w-20">
                    <div class="label p-0">
                        <span class="label-text">Color</span>
                    </div>
                    <input type="text" class="input input-bordered input-sm w-full " />
                </label>
                <label class="form-control w-20">
                    <div class="label p-0">
                        <span class="label-text">Color</span>
                    </div>
                    <input type="text" class="input input-bordered input-sm w-full " />
                </label>
                <label class="form-control w-20">
                    <div class="label p-0">
                        <span class="label-text">Color</span>
                    </div>
                    <input type="text" class="input input-bordered input-sm w-full " />
                </label>
            </div>
        </>

    )
}