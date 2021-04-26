
class SenderWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.port.onmessage = this.handleMessage.bind(this);
	this.buf = new Float32Array(128);
    }

    handleMessage(message) {
        if (message.data.type === "send-buffer") {
            let sharedBuffer = message.data.data;
	    let ringBuffer = new RingBuffer(sharedBuffer, Float32Array);
	    this.audioWriter = new AudioWriter(ringBuffer);
        }
    }
    process(inputs, outputs) {
        // By default, the node has single input and output.

	for (var i=0; i < 128; i++) {
	    this.buf[i] = inputs[0][0][i];
	}
	if (this.audioWriter.available_write() >= this.buf.length) {
	    this.audioWriter.enqueue(this.buf);
	}
    }
}

registerProcessor('sender-worklet-processor', SenderWorkletProcessor);
