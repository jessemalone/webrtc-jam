import {AudioReader, RingBuffer} from 'ringbuf.js'

class ReceiverWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.initialized = false;
        this.port.onmessage = this.handleMessage.bind(this);
	this.buf = new Float32Array(128);
    }

    handleMessage(e) {
        if (e.data.type === "receive-buffer") {
            let sharedBuffer = e.data.data;
	    let ringBuffer = new RingBuffer(sharedBuffer, Float32Array);
	    this.audioReader = new AudioReader(ringBuffer);
            this.outputBuffer = new Float32Array(sharedBuffer);
        }
    }
    process(inputs, outputs) {

	this.audioReader.dequeue(buf);

	for (var i=0;i < 128; i++) {
	    outputs[0][0][i] = this.buf[i]
	}
    }
}

registerProcessor('receiver-worklet-processor', ReceiverWorkletProcessor);
