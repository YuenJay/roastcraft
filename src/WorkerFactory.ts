export default class WorkerFactory {
    constructor(workerFunction: any) {
        const workerCode = workerFunction.toString();
        const workerBlob = new Blob([`(${workerCode})()`]);
        return new Worker(URL.createObjectURL(workerBlob));
    }
}