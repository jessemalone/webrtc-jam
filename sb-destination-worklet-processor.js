const STATES = {
    READY_TO_READ: 0,
    READY_TO_SEND: 1
}

class SBDestinationWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.initialized = false;
        this.port.onmessage = this.handleMessage.bind(this);
    }

    handleMessage(message) {
        if (message.data.type === "initialize") {
            let outputBuffer = message.data.outputBuffer;
            let signalBuffer = message.data.signalBuffer;
            this.outputBuffer = new Float32Array(outputBuffer);
            this.signalBuffer = new Int32Array(signalBuffer);
            this.port.postMessage({
                message: {
                    type: "PROCESSOR_READY"
                }
            });
            this.initialized = true;
        }
    }
    process(inputs, outputs) {
        // don't process anything if not ready
        if (!this.initialized) {
            return true;
        }

        // YOU ARE HERE, wait on ready to receive, write samples, then set data ready to be consumed: see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics/wait 
        Atomics.wait(this.signalBuffer, STATES.READY_TO_READ,0);

        // Fill up the shared audio buffer
        Atomics.store(this.signalBuffer, STATES.READY_TO_READ,0);
        console.log("SBDestination clear to process");
        
        // Notify that buffer is ready to send
        Atomics.store(this.signalBuffer, STATES.READY_TO_SEND,1);
        Atomics.notify(this.signalBuffer, STATES.READY_TO_SEND,1);

        return true;
    }
}

registerProcessor('sb-destination-worklet-processor', SBDestinationWorkletProcessor);
