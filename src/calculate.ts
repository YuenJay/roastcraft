// SPDX-License-Identifier: GPL-3.0-or-later

import { produce, unwrap } from "solid-js/store";
import useAppStore, { AppState, Point, Event, EventId } from "./AppStore";
import { mean, standardDeviation, linearRegression, linearRegressionLine } from "simple-statistics";
// import { median, medianAbsoluteDeviation } from "simple-statistics";
import { trace, attachConsole, info } from "tauri-plugin-log-api";
import * as d3 from "d3-array";

const [appStore, setAppStore] = useAppStore;

export function timestamp_format(timestamp: number) {
    return Math.floor(timestamp / 60).toString().padStart(2, '0') + ":" + (timestamp % 60).toString().padStart(2, '0');
}

export function calculateRor(metrics_index: number) {
    let data: Array<Point> = unwrap(appStore.metrics[metrics_index].data);

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

    setAppStore(
        produce((appStore) => {
            appStore.metrics[metrics_index].ror = ror_array;
        })
    )

}

export function findRorOutlier(metrics_index: number) {

    let ror: Array<Point> = unwrap(appStore.metrics[metrics_index].ror);

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
                appStore.metrics[metrics_index].ror[i]
            )

        } else {
            ror_filtered.push(
                appStore.metrics[metrics_index].ror[i]
            )
        }
    }

    // smooth 
    let value_blurred = d3.blur(ror_filtered.map(p => p.value), 2);
    for (let i = 0; i < ror_filtered.length; i++) {
        ror_filtered[i].value = value_blurred[i];
    }

    setAppStore(
        produce((appStore) => {
            appStore.metrics[metrics_index].ror_outlier = ror_outlier;
            appStore.metrics[metrics_index].ror_filtered = ror_filtered;
        })
    )

    // find ROR TP
    if (appStore.event_state.TP == true && appStore.event_state.ROR_TP == false) {
        let window_size = 9
        let window = ror_filtered.slice(-window_size).map((r) => ([r.timestamp, r.value]));
        if (linearRegression(window).m < 0) {
            let target_index = window.length - 5;
            setAppStore(
                produce((appStore) => {
                    appStore.event_state.ROR_TP = true;
                    appStore.events.push(new Event(
                        EventId.ROR_TP,
                        window[target_index][0],
                        window[target_index][1]
                    ));

                })
            )
        }
    }

    // ROR linear regression all
    if (appStore.event_state.ROR_TP == true && appStore.event_state.DROP == false) {
        let ROR_TP_timestamp = (appStore.events.find(r => r.id == EventId.ROR_TP) as Event).timestamp;
        let window = ror_filtered.filter((r) => (r.timestamp > ROR_TP_timestamp)).map((r) => ([r.timestamp, r.value]));
        let l = linearRegressionLine(linearRegression(window));
        setAppStore(
            produce((appStore) => {
                appStore.ROR_linear_start = {
                    timestamp: window[0][0],
                    value: l(window[0][0])
                };
                appStore.ROR_linear_end = {
                    timestamp: window[window.length - 1][0],
                    value: l(window[window.length - 1][0])
                }
            })
        )
    }

}

// reference: artisan/src/artisanlib/main.py  BTbreak()
// idea:
// . average delta before i-2 is not negative
// . average delta after i-2 is negative and twice as high (absolute) as the one before
export function autoDetectChargeDrop() {
    let m_index: number = 0 // metrics index for BT
    let ror: Array<any> = unwrap(appStore.metrics[m_index].ror);

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

            if (appStore.event_state.CHARGE == false) {
                info("auto detected charge at ror index: " + (target_index));

                setAppStore(
                    produce((appStore) => {
                        appStore.event_state.CHARGE = true;
                        appStore.events.push(new Event(
                            EventId.CHARGE,
                            appStore.metrics[m_index].data[target_index].timestamp,
                            appStore.metrics[m_index].data[target_index].value
                        ));
                        appStore.time_delta = - appStore.metrics[m_index].data[target_index].timestamp;
                    })
                )
            } else if (appStore.event_state.CHARGE == true && appStore.event_state.TP == true && appStore.event_state.DROP == false) {
                info("auto detected drop at ror index: " + (target_index));

                setAppStore(
                    produce((appStore) => {
                        appStore.event_state.DROP = true;
                        appStore.events.push(new Event(
                            EventId.DROP,
                            appStore.metrics[m_index].data[target_index].timestamp,
                            appStore.metrics[m_index].data[target_index].value
                        ));
                    })
                )
            }
        }
    }
}

// find lowest point in BT
export function findTurningPoint() {

    // only detect turning point after charge
    if (appStore.event_state.CHARGE == false || appStore.event_state.TP == true) {
        return
    }

    let tp = 1000;
    let high_temp = 0;

    // last 2 BT value greater than updated min tp
    let data: Array<any> = unwrap(appStore.metrics[0].data);

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
        setAppStore(
            produce((appStore) => {
                appStore.event_state.TP = true;
                appStore.events.push(new Event(
                    EventId.TP,
                    appStore.metrics[0].data[target_index].timestamp,
                    appStore.metrics[0].data[target_index].value
                ));

            })
        )
    }
}

export function findDryEnd() {

    // only detect dry end after turning point
    if (appStore.event_state.TP == false || appStore.event_state.DRY_END == true) {
        return
    }

    let data: Array<any> = appStore.metrics[0].data;

    let dry_end = 150;

    // last 2 BT reading > tp
    if (data[data.length - 1].value > dry_end && data[data.length - 2].value > dry_end) {
        let target_index = data.length - 2;
        setAppStore(
            produce((appStore) => {
                appStore.event_state.DRY_END = true;
                appStore.events.push(new Event(
                    EventId.DRY_END,
                    appStore.metrics[0].data[target_index].timestamp,
                    appStore.metrics[0].data[target_index].value
                ));
            })
        )
    }
}

export function calculatePhases() {

}