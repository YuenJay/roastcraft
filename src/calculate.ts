// SPDX-License-Identifier: GPL-3.0-or-later

import { GET, SET, Point, Event, EventId, RoastPhase, Phase, appStateSig } from "./AppState";
import { mean, standardDeviation, linearRegression, linearRegressionLine } from "simple-statistics";
// import { median, medianAbsoluteDeviation } from "simple-statistics";
import { info } from "tauri-plugin-log-api";
import * as d3 from "d3-array";

const [appState, setAppState] = appStateSig;
const [timer, setTimer] = appState().timerSig;
const [metrics, setMetrics] = appState().metricsSig;
const [events, setEvents] = appState().eventsSig;
const [eventCHARGE, setEventCHARGE] = appState().eventCHARGESig;
const [eventDRY_END, setEventDRY_END] = appState().eventDRY_ENDSig;
const [eventDROP, setEventDROP] = appState().eventDROPSig;
const [eventTP, setEventTP] = appState().eventTPSig;
const [eventROR_TP, setEventROR_TP] = appState().eventROR_TPSig;
const [roastPhase, setRoastPhase] = appState().roastPhaseSig
const [dryingPhase, setDryingPhase] = appState().dryingPhaseSig;
const [maillardPhase, setMaillardPhase] = appState().maillardPhaseSig;
const [developPhase, setDevelopPhase] = appState().developPhaseSig;

export function timestamp_format(timestamp: number) {
    return Math.floor(timestamp / 60).toString().padStart(2, '0') + ":" + (timestamp % 60).toString().padStart(2, '0');
}

export function calculateRor() {
    let mIndex = appState().btIndex; // metrics index for BT
    let data: Array<Point> = metrics()[mIndex].data();

    let ror_array = Array<Point>();

    for (let i = 0; i < data.length; i++) {

        let window_size = 5
        let window = data.slice(Math.max(0, i - window_size + 1), i + 1);

        let delta = window[window.length - 1].value - window[0].value;
        let time_elapsed_sec = window[window.length - 1].timestamp - window[0].timestamp;

        let ror = (Math.floor(delta / time_elapsed_sec * 60 * 10)) / 10 || 0

        ror_array.push(
            new Point(data[i].timestamp, ror)
        );
    }

    metrics()[mIndex].rorSig[SET](ror_array);
}

export function findRorOutlier() {

    let mIndex = appState().btIndex; // metrics index for BT

    let ror: Array<Point> = metrics()[mIndex].rorSig[GET]();

    let ror_outlier = new Array<Point>();
    let ror_filtered = new Array<Point>();


    for (let i = 0; i < ror.length; i++) {
        if (i == 0) {
            continue;
        }

        let window_size = 5
        let window = ror.slice(Math.max(0, i - window_size), i).map(r => r.value); // window doesn't include i

        let ma = mean(window); // moving average
        let sd = standardDeviation(window); // standard deviation
        let zScore = Math.abs((ror[i].value - ma) / sd);

        // https://eurekastatistics.com/using-the-median-absolute-deviation-to-find-outliers/
        // The MAD=0 Problem
        // If more than 50% of your data have identical values, your MAD will equal zero. 
        // All points in your dataset except those that equal the median will then be flagged as outliers, 
        // regardless of the level at which you've set your outlier cutoff. 
        // (By constrast, if you use the standard-deviations-from-mean approach to finding outliers, 
        // Chebyshev's inequality puts a hard limit on the percentage of points that may be flagged as outliers.) 
        // So at the very least check that you don't have too many identical data points before using the MAD to flag outliers.

        // let m = median(window);
        // let mad = medianAbsoluteDeviation(window);
        // let modifiedZScore = Math.abs(0.6745 * (ror[i].value - m) / mad);
        // console.log(m);
        // console.log(mad);
        // console.log("modifiedZScore: " + modifiedZScore);

        if (zScore > 3) {
            ror_outlier.push(
                metrics()[mIndex].rorSig[GET]()[i]
            )

        } else {
            ror_filtered.push(
                metrics()[mIndex].rorSig[GET]()[i]
            )
        }
    }

    let hann_window = [];
    let window_len = 11;
    let half_window_len = Math.floor((window_len - 1) / 2);

    for (let i = 0; i < window_len; i++) {
        hann_window.push(hann(i, window_len))
    }

    let sum = hann_window.reduce((partialSum, a) => partialSum + a, 0);

    let filter = hann_window.map((m) => (m / sum));

    // let data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    let data = ror_filtered.map(p => p.value);
    let dataLeft = data.slice(1, window_len).reverse();
    let dataRight = data.slice(-window_len, -1).reverse();
    let input = [...dataLeft, ...data, ...dataRight];
    let conv = convValid(filter, input);
    let result = conv.slice(half_window_len, -half_window_len);

    let ror_convolve = new Array<Point>();
    let lag = 3; // lag few samples, so that end of convolve line won't look like jumping around
    for (let i = 0; i < ror_filtered.length - lag; i++) {
        ror_convolve.push(new Point(
            ror_filtered[i].timestamp,
            result[i]
        ));
    }

    metrics()[mIndex].rorOutlierSig[SET](ror_outlier);
    metrics()[mIndex].rorFilteredSig[SET](ror_filtered);
    metrics()[mIndex].rorConvolveSig[SET](ror_convolve);


    // find ROR TP
    if (eventTP() == true && eventROR_TP() == false) {
        let window_size = 9
        let window = ror_filtered.slice(-window_size).map((r) => ([r.timestamp, r.value]));
        if (linearRegression(window).m < 0) {
            let target_index = window.length - 5;

            setEventROR_TP(true);
            setEvents([...events(), new Event(
                EventId.ROR_TP,
                window[target_index][0],
                window[target_index][1]
            )]);
        }
    }

    // ROR linear regression all
    if (eventROR_TP() == true && eventDROP() == false) {
        let ROR_TP_timestamp = (events().find(r => r.id == EventId.ROR_TP) as Event).timestamp;
        let window = ror_filtered.filter((r) => (r.timestamp > ROR_TP_timestamp)).map((r) => ([r.timestamp, r.value]));
        let mb = linearRegression(window); // m: slope, b: intersect
        let l = linearRegressionLine(mb);

        appState().rorLinearStartSig[SET](new Point(
            window[0][0],
            l(window[0][0])
        ));
        appState().rorLinearEndSig[SET](new Point(
            window[window.length - 1][0],
            l(window[window.length - 1][0])
        ));
        appState().rorLinearSlopeSig[SET](mb.m);
    }

}

// reference: artisan/src/artisanlib/main.py  BTbreak()
// idea:
// . average delta before i-2 is not negative
// . average delta after i-2 is negative and twice as high (absolute) as the one before
export function autoDetectChargeDrop() {
    let mIndex: number = appState().btIndex; // metrics index for BT

    let data: Array<Point> = metrics()[mIndex].data();
    let ror: Array<Point> = metrics()[mIndex].rorSig[GET]();

    let window_size = 5
    if (ror.length >= window_size) {

        let window = ror.slice(Math.max(0, ror.length - window_size), ror.length).map(r => r.value);

        // window array: [    0][    1][     2][    3][    4]
        //    ror array: [len-5][len-4][*len-3][len-2][len-1]
        //                              ^^^^^^
        //                              CHARGE

        let dpre = window[1] + window[2] / 2.0;
        let dpost = window[3] + window[4] / 2.0;
        if (window[1] > 0.0 && window[2] > 0.0
            && window[3] < 0.0 && window[3] < 0.0
            && Math.abs(dpost) > Math.abs(dpre) * 2) {
            let target_index = ror.length - 3;

            if (eventCHARGE() == false) {
                info("auto detected charge at ror index: " + (target_index));

                appState().timeDeltaSig[SET](- data[target_index].timestamp);
                setEventCHARGE(true);
                setEvents([...events(), new Event(
                    EventId.CHARGE,
                    data[target_index].timestamp,
                    data[target_index].value)]);
                setRoastPhase(RoastPhase.DRYING);

            } else if (eventCHARGE() == true && eventTP() == true && eventDROP() == false) {
                info("auto detected drop at ror index: " + (target_index));

                setEventDROP(true);
                setEvents([...events(), new Event(
                    EventId.DROP,
                    data[target_index].timestamp,
                    data[target_index].value
                )]);
                setRoastPhase(RoastPhase.AFTER_DROP);
            }
        }
    }
}

// find lowest point in BT
export function findTurningPoint() {

    // only detect turning point after charge
    if (eventCHARGE() == false || eventTP() == true) {
        return
    }

    let tp = 1000;
    let high_temp = 0;

    // last 2 BT value greater than updated min tp
    let data: Array<Point> = metrics()[appState().btIndex].data();

    let target_index = 0;
    let tp_found = false;
    let temp_drop = 0;
    for (let i = 0; i < data.length; i++) {

        tp = Math.min(data[i].value, tp);
        high_temp = Math.max(data[i].value, high_temp);

        temp_drop = high_temp - tp;

        // last 2 BT reading > tp
        if (data[data.length - 1].value > tp && data[data.length - 2].value > tp && temp_drop > 50) {
            target_index = data.length - 3;
            tp_found = true;
            break;
        }
    }

    if (tp_found) {

        setEventTP(true);
        setEvents([...events(), new Event(
            EventId.TP,
            data[target_index].timestamp,
            data[target_index].value
        )]);

    }
}

export function findDryEnd() {

    // only detect dry end after turning point
    if (eventTP() == false || eventDRY_END() == true) {
        return
    }

    let data: Array<Point> = metrics()[appState().btIndex].data();

    let dry_end = 150;

    // last 2 BT reading > tp
    if (data[data.length - 1].value > dry_end && data[data.length - 2].value > dry_end) {
        let target_index = data.length - 2;

        setEventDRY_END(true);
        setEvents([...events(), new Event(
            EventId.DRY_END,
            data[target_index].timestamp,
            data[target_index].value
        )]);
        setRoastPhase(RoastPhase.MAILLARD);
    }
}

export function calculatePhases() {

    let mIndex = appState().btIndex; // metrics index for BT

    if (roastPhase() == RoastPhase.DRYING) {
        let charge = events().find(r => r.id == EventId.CHARGE) as Event;
        let temp_rise = 0;
        if (eventTP()) {
            let tp = (events().find(r => r.id == EventId.TP) as Event);
            temp_rise = metrics()[mIndex].currentDataSig[GET]() - tp.value;
        }
        setDryingPhase(new Phase(
            timer() - charge.timestamp,
            100.0,
            temp_rise
        ));
    } else if (roastPhase() == RoastPhase.MAILLARD) {
        let charge = events().find(r => r.id == EventId.CHARGE) as Event;
        let tp = events().find(r => r.id == EventId.TP) as Event;
        let de = events().find(r => r.id == EventId.DRY_END) as Event;

        let drying_time = de.timestamp - charge.timestamp;
        let drying_temp_rise = de.value - tp.value;

        let maillard_time = timer() - de.timestamp;
        let maillard_temp_rise = metrics()[mIndex].currentDataSig[GET]() - de.value;

        setDryingPhase(new Phase(
            drying_time,
            drying_time / (drying_time + maillard_time) * 100,
            drying_temp_rise
        ));

        setMaillardPhase(new Phase(
            maillard_time,
            maillard_time / (drying_time + maillard_time) * 100,
            maillard_temp_rise
        ));

    } else if (roastPhase() == RoastPhase.DEVELOP) {
        let charge = events().find(r => r.id == EventId.CHARGE) as Event;
        let tp = events().find(r => r.id == EventId.TP) as Event;
        let de = events().find(r => r.id == EventId.DRY_END) as Event;
        let fc = events().find(r => r.id == EventId.FC_START) as Event;

        let drying_time = de.timestamp - charge.timestamp;
        let drying_temp_rise = de.value - tp.value;

        let maillard_time = fc.timestamp - de.timestamp;
        let maillard_temp_rise = fc.value - de.value;

        let develop_time = timer() - fc.timestamp;
        let develop_temp_rise = metrics()[mIndex].currentDataSig[GET]() - fc.value;

        setDryingPhase(new Phase(
            drying_time,
            drying_time / (drying_time + maillard_time + develop_time) * 100,
            drying_temp_rise
        ));

        setMaillardPhase(new Phase(
            maillard_time,
            maillard_time / (drying_time + maillard_time + develop_time) * 100,
            maillard_temp_rise
        ));

        setDevelopPhase(new Phase(
            develop_time,
            develop_time / (drying_time + maillard_time + develop_time) * 100,
            develop_temp_rise
        ));

    } else if (roastPhase() == RoastPhase.AFTER_DROP) {
        let charge = events().find(r => r.id == EventId.CHARGE) as Event;
        let tp = events().find(r => r.id == EventId.TP) as Event;
        let de = events().find(r => r.id == EventId.DRY_END) as Event;
        let fc = events().find(r => r.id == EventId.FC_START) as Event;
        let drop = events().find(r => r.id == EventId.DROP) as Event;

        let drying_time = de.timestamp - charge.timestamp;
        let drying_temp_rise = de.value - tp.value;

        let maillard_time = fc.timestamp - de.timestamp;
        let maillard_temp_rise = fc.value - de.value;

        let develop_time = drop.timestamp - fc.timestamp;
        let develop_temp_rise = drop.value - fc.value;

        setDryingPhase(new Phase(
            drying_time,
            drying_time / (drying_time + maillard_time + develop_time) * 100,
            drying_temp_rise
        ));

        setMaillardPhase(new Phase(
            maillard_time,
            maillard_time / (drying_time + maillard_time + develop_time) * 100,
            maillard_temp_rise
        ));

        setDevelopPhase(new Phase(
            develop_time,
            develop_time / (drying_time + maillard_time + develop_time) * 100,
            develop_temp_rise
        ));
    }
}

function hann(i: number, N: number) {
    return 0.5 * (1 - Math.cos(6.283185307179586 * i / (N - 1)))
}

// reference: https://stackoverflow.com/questions/24518989/how-to-perform-1-dimensional-valid-convolution
function convValid(f: Array<number>, g: Array<number>) {
    const nf = f.length;
    const ng = g.length;
    const minV = (nf < ng) ? f : g;
    const maxV = (nf < ng) ? g : f;
    const n = Math.max(nf, ng) - Math.min(nf, ng) + 1;
    const out = new Array(n).fill(0);

    for (let i = 0; i < n; ++i) {
        for (let j = minV.length - 1, k = i; j >= 0; --j) {
            out[i] += minV[j] * maxV[k];
            ++k;
        }
    }

    return out;
}