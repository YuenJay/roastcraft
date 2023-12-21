// SPDX-License-Identifier: GPL-3.0-or-later

import { GET, SET, Point, Event, EventId, RoastPhase, Phase, appStateSig } from "./AppState";
import { mean, standardDeviation, linearRegression, linearRegressionLine } from "simple-statistics";
// import { median, medianAbsoluteDeviation } from "simple-statistics";
import { info, warn } from "tauri-plugin-log-api";

const [appState, _setAppState] = appStateSig;
const [timer, _setTimer] = appState().timerSig;
const [channelArr, _setChannelArr] = appState().channelArrSig;
const [eventArr, setEventArr] = appState().eventArrSig;
const [eventCHARGE, setEventCHARGE] = appState().eventCHARGESig;
const [eventDRY_END, setEventDRY_END] = appState().eventDRY_ENDSig;
const [eventDROP, setEventDROP] = appState().eventDROPSig;
const [eventTP, setEventTP] = appState().eventTPSig;
const [eventROR_TP, setEventROR_TP] = appState().eventROR_TPSig;
const [roastPhase, setRoastPhase] = appState().roastPhaseSig
const [_dryingPhase, setDryingPhase] = appState().dryingPhaseSig;
const [_maillardPhase, setMaillardPhase] = appState().maillardPhaseSig;
const [_developPhase, setDevelopPhase] = appState().developPhaseSig;

export function timestamp_format(timestamp: number) {
    return Math.floor(timestamp / 60).toString().padStart(2, '0') + ":" + (timestamp % 60).toString().padStart(2, '0');
}

export function calculateRor() {

    let bt = channelArr()[appState().btIndex];
    let data: Array<Point> = bt.dataArr();

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

    bt.rorArrSig[SET](ror_array);
}

export function findRorOutlier() {

    let mIndex = appState().btIndex; // channel index for BT

    let ror: Array<Point> = channelArr()[mIndex].rorArrSig[GET]();

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
                channelArr()[mIndex].rorArrSig[GET]()[i]
            )

        } else {
            ror_filtered.push(
                channelArr()[mIndex].rorArrSig[GET]()[i]
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

    channelArr()[mIndex].rorOutlierArrSig[SET](ror_outlier);
    channelArr()[mIndex].rorFilteredArrSig[SET](ror_filtered);
    channelArr()[mIndex].rorConvolveArrSig[SET](ror_convolve);


    // find ROR TP
    if (eventTP() == true && eventROR_TP() == false) {
        let window_size = 9
        let window = ror_filtered.slice(-window_size).map((r) => ([r.timestamp, r.value]));
        if (linearRegression(window).m < 0) {
            let target_index = window.length - 5;

            setEventROR_TP(true);
            setEventArr([...eventArr(), new Event(
                EventId.ROR_TP,
                window[target_index][0],
                window[target_index][1]
            )]);
        }
    }

    // ROR linear regression all
    if (eventROR_TP() == true && eventDROP() == false) {
        let ROR_TP_timestamp = (eventArr().find(r => r.id == EventId.ROR_TP) as Event).timestamp;
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
    let mIndex: number = appState().btIndex; // channel index for BT

    let data: Array<Point> = channelArr()[mIndex].dataArr();
    let ror: Array<Point> = channelArr()[mIndex].rorArrSig[GET]();

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
                setEventArr([...eventArr(), new Event(
                    EventId.CHARGE,
                    data[target_index].timestamp,
                    data[target_index].value)]);
                setRoastPhase(RoastPhase.DRYING);

            } else if (eventCHARGE() == true && eventTP() == true && eventDROP() == false) {
                info("auto detected drop at ror index: " + (target_index));

                setEventDROP(true);
                setEventArr([...eventArr(), new Event(
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
    let data: Array<Point> = channelArr()[appState().btIndex].dataArr();

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
        setEventArr([...eventArr(), new Event(
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

    let data: Array<Point> = channelArr()[appState().btIndex].dataArr();

    let dry_end = 150;

    // last 2 BT reading > tp
    if (data[data.length - 1].value > dry_end && data[data.length - 2].value > dry_end) {
        let target_index = data.length - 2;

        setEventDRY_END(true);
        setEventArr([...eventArr(), new Event(
            EventId.DRY_END,
            data[target_index].timestamp,
            data[target_index].value
        )]);
        setRoastPhase(RoastPhase.MAILLARD);
    }
}

export function calculatePhases() {

    //   charge	tp	de	fc	drop	last point  phases	                    
    //   ------------------------------------------------------------------
    //   o	    x	x	x	x	    timer	    drying
    // 1 o	    o	x	x	x	    timer	    drying
    // 2 o	    o	o	x	x	    timer	    drying + maillard
    // 3 o	    o	o	o	x	    timer	    drying + maillard + develop
    // 4 o	    o	o	o	o	    drop time	drying + maillard + develop
    // 5 o	    o	x	x	o	    drop time	drying
    // 6 o	    o	x	o	o	    drop time	drying + develop
    // 7 o	    o	o	x	o	    drop time	drying + maillard
    // 8 o	    o	x	o	x	    timer	    drying + develop

    let bt = channelArr()[appState().btIndex];

    let charge = eventArr().find(r => r.id == EventId.CHARGE);
    if (charge == undefined) {
        warn!("no CHARGE event");
        return;
    }

    let tp = eventArr().find(r => r.id == EventId.TP);
    if (tp == undefined) {
        setDryingPhase(new Phase(
            timer() - charge.timestamp,
            100.0,
            0.0
        ));
        return;
    }

    let de = eventArr().find(r => r.id == EventId.DRY_END);
    let fc = eventArr().find(r => r.id == EventId.FC_START);
    let drop = eventArr().find(r => r.id == EventId.DROP);

    let t = timer();
    let lastTemp = bt.currentDataSig[GET]();
    if (drop != undefined) {
        t = drop.timestamp;
        lastTemp = drop.value;
    }

    if (de == undefined && fc == undefined) {
        // condition 1, 5

        setDryingPhase(new Phase(
            t - charge.timestamp,
            100.0,
            lastTemp - tp.value
        ));
    } else if (de != undefined && fc == undefined) {
        // condition 2, 7

        let drying_time = de.timestamp - charge.timestamp;
        let drying_temp_rise = de.value - tp.value;

        let maillard_time = t - de.timestamp;
        let maillard_temp_rise = lastTemp - de.value;

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
    } else if (de != undefined && fc != undefined) {
        // condition 3, 4

        let drying_time = de.timestamp - charge.timestamp;
        let drying_temp_rise = de.value - tp.value;

        let maillard_time = fc.timestamp - de.timestamp;
        let maillard_temp_rise = fc.value - de.value;

        let develop_time = t - fc.timestamp;
        let develop_temp_rise = lastTemp - fc.value;

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
    } else if (de == undefined && fc != undefined) {
        // condition 6, 8

        let drying_time = fc.timestamp - charge.timestamp;
        let drying_temp_rise = fc.value - tp.value;

        let develop_time = t - fc.timestamp;
        let develop_temp_rise = lastTemp - fc.value;

        setDryingPhase(new Phase(
            drying_time,
            drying_time / (drying_time + develop_time) * 100,
            drying_temp_rise
        ));

        setDevelopPhase(new Phase(
            develop_time,
            develop_time / (drying_time + develop_time) * 100,
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