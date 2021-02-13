class SBDestinationWorkletNode extends AudioWorkletNode {
    static STATES = {
        'READY_TO_READ': 0,
        'READY_TO_SEND': 1
    }
    static bytesPerSample = Float32Array.BYTES_PER_ELEMENT;
    static bytesPerState = Int32Array.BYTES_PER_ELEMENT;

    constructor(context, outputBuffer, signalBuffer) {
        super(context, 'sb-destination-worklet-processor');
        this.outputBuffer = outputBuffer;
        this.signalBuffer = signalBuffer;
        this.port.onmessage = this.onProcessorInitialized.bind(this);
        this.port.postMessage({type: 'initialize', signalBuffer: this.signalBuffer, outputBuffer: this.outputBuffer});
    }


    onProcessorInitialized(event) {
        const data = event.data;
        if (data.message.type === 'PROCESSOR_READY' &&
            typeof this.onInitialized === 'function') {
            this.onInitialized();
            return;
        }
    }
}
