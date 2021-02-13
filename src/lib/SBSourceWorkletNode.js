class SBSourceWorkletNode extends AudioWorkletNode {
    constructor(context, outputBuffer) {
        super('context', 'sb-source-worklet-processor');
        this.outputBuffer = outputBuffer;
        this.port.onmessage = this.onProcessorInitialized.bind(this);

    }

    onProcessorInitialized(event) {
        const data = eventFromProcessor.data;
        if (data.message.type === 'PROCESSOR_READY' &&
            typeof this.onInitialized === 'function') {
            this.onInitialized();
            return;
        }
    }
}
