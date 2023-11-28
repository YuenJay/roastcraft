import { produce, unwrap } from "solid-js/store";
import useAppStore, { AppState } from "./AppStore";
import { mean, standardDeviation, linearRegression, linearRegressionLine } from "simple-statistics";
// import { median, medianAbsoluteDeviation } from "simple-statistics";
import { trace, attachConsole, info } from "tauri-plugin-log-api";

const [appStore, setAppStore] = useAppStore;

export function calculateRor(metrics_index: number) {
    let data: Array<any> = unwrap(appStore.metrics[metrics_index].data);

    let ror_array = Array<any>();

    for (let i = 0; i < data.length; i++) {

        let window_size = 5
        let window = data.slice(Math.max(0, i - window_size + 1), i + 1);

        let delta = window[window.length - 1].value - window[0].value;
        let time_elapsed_sec = window[window.length - 1].timestamp - window[0].timestamp;

        let ror = (Math.floor(delta / time_elapsed_sec * 60 * 10)) / 10 || 0

        ror_array.push(
            {
                timestamp: data[i].timestamp,
                value: ror,
            }
        );

    }

    setAppStore(
        produce((appStore) => {
            appStore.metrics[metrics_index].ror = ror_array;
        })
    )

}

export function findRorOutlier(metrics_index: number) {

    let ror: Array<any> = unwrap(appStore.metrics[metrics_index].ror);

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
            setAppStore(
                produce((appStore) => {
                    appStore.metrics[metrics_index].ror[i].outlier = true;
                })
            )
        }
    }

    // find ROR TP
    if (appStore.TP == true && appStore.ROR_TP == false) {
        let window_size = 9
        let window = ror.filter((r) => (r.outlier != true)).slice(-window_size).map((r) => ([r.timestamp, r.value]));
        if (linearRegression(window).m < 0) {
            let target_index = window.length - 5;
            setAppStore(
                produce((appStore) => {
                    appStore.ROR_TP = true;
                    appStore.ror_events.push({
                        type: "PHASE",
                        id: "ROR_TP",
                        timestamp: window[target_index][0],
                        value: window[target_index][1]
                    });

                })
            )
        }
    }

    // ROR linear regression all
    if (appStore.ROR_TP == true && appStore.phase_button_state.DROP == false) {
        let ROR_TP_timestamp = appStore.ror_events.find((r) => (r.id == "ROR_TP")).timestamp;
        let window = ror.filter((r) => (r.outlier != true && r.timestamp > ROR_TP_timestamp)).map((r) => ([r.timestamp, r.value]));
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

    // ROR linear regression recent
    if (appStore.ROR_TP == true && appStore.phase_button_state.DROP == false) {
        let ROR_TP_timestamp = appStore.ror_events.find((r) => (r.id == "ROR_TP")).timestamp;
        let window_size = 15
        let window = ror.filter((r) => (r.outlier != true && r.timestamp > ROR_TP_timestamp)).slice(-window_size).map((r) => ([r.timestamp, r.value]));
        let l = linearRegressionLine(linearRegression(window));
        setAppStore(
            produce((appStore) => {
                appStore.ROR_linear_start2 = {
                    timestamp: window[0][0],
                    value: l(window[0][0])
                };
                appStore.ROR_linear_end2 = {
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
export function autoDetectCharge() {
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

            if (appStore.phase_button_state.CHARGE == false) {
                info("auto detected charge at ror index: " + (target_index));

                setAppStore(
                    produce((appStore) => {
                        appStore.phase_button_state.CHARGE = true;
                        appStore.events.push({
                            type: "PHASE",
                            id: "CHARGE",
                            timestamp: appStore.metrics[m_index].data[target_index].timestamp,
                            value: appStore.metrics[m_index].data[target_index].value
                        });
                        appStore.time_delta = - appStore.metrics[m_index].data[target_index].timestamp;
                    })
                )
            } else if (appStore.phase_button_state.CHARGE == true && appStore.phase_button_state.DROP == false) {
                info("auto detected drop at ror index: " + (target_index));

                setAppStore(
                    produce((appStore) => {
                        appStore.phase_button_state.DROP = true;
                        appStore.events.push({
                            type: "PHASE",
                            id: "DROP",
                            timestamp: appStore.metrics[m_index].data[target_index].timestamp,
                            value: appStore.metrics[m_index].data[target_index].value
                        });

                    })
                )
            }


        }


    }
}

// find lowest point in BT
export function findTurningPoint() {

    // only detect turning point after charge
    if (appStore.phase_button_state.CHARGE == false || appStore.TP == true) {
        return
    }

    let tp = 1000;

    // last 2 BT value greater than updated min tp
    let data: Array<any> = unwrap(appStore.metrics[0].data);

    for (let i = 0; i < data.length; i++) {

        tp = Math.min(data[i].value, tp);

        // last 2 BT reading > tp
        if (data[data.length - 1].value > tp && data[data.length - 2].value > tp) {
            let target_index = data.length - 3;
            setAppStore(
                produce((appStore) => {

                    appStore.TP = true;
                    appStore.events.push({
                        type: "PHASE",
                        id: "TP",
                        timestamp: appStore.metrics[0].data[target_index].timestamp,
                        value: appStore.metrics[0].data[target_index].value
                    });

                })
            )
        }

    }
}