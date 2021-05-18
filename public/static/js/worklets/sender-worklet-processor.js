
class SenderWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.port.onmessage = this.handleMessage.bind(this);
	this.buf = new Float32Array(128);
    }

    handleMessage(message) {
	console.log("DEBUG sender processor got message");
        if (message.data.type === "send-buffer") {
            let sharedBuffer = message.data.data;
	    console.log(message);
	    let ringBuffer = new RingBuffer(sharedBuffer, Float32Array);
	    this.audioWriter = new AudioWriter(ringBuffer);
        }
    }
    process(inputs, outputs) {
        // By default, the node has single input and output.

	if (inputs[0].length == 0) {
	    return true;
	}
	for (var i=0; i < 128; i++) {
	    this.buf[i] = inputs[0][0][i];
	}
	if (this.audioWriter.available_write() >= this.buf.length) {
	    console.log("DEBUG: sender worklet sending");
	    console.log(this.buf);
	    this.audioWriter.enqueue(this.buf);
	}

	return true;
    }
}

registerProcessor('sender-worklet-processor', SenderWorkletProcessor);
