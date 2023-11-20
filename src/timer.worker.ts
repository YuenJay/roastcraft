export default () => {

    let timer = 0;
    let started = false;

    self.onmessage = (event) => {
        if (started == false) {

            const interval = event.data;
            timer = 0;
            started = true;

            setInterval(() => {
                timer = timer + 1;
                self.postMessage(timer);
            }, interval);
        }
    };
};