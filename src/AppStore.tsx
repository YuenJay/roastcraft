import { createStore } from 'solid-js/store'

export enum AppState {
    OFF,
    ON,
    RECORDING,
    RECORDED
}

export default createStore({
    appState: AppState.OFF,
    timer: 0,
    BT: 0.0,
    metrics: [{ id: "BT", label: "Bean Temp", unit: "celcius", data: new Array() }]
})



