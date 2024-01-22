// SPDX-License-Identifier: GPL-3.0-or-later

import { For, Show, createEffect, createSignal } from "solid-js";
import { GET, SET, appStateSig } from "./AppState";

export default function NotesPanel(props: any) {

    const [appState, _setAppState] = appStateSig;

    const [recentTitles, setRecentTitles] = createSignal(JSON.parse(localStorage.getItem("recentTitles") || "[]") as Array<string>);

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