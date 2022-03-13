
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
	    this.ringBuffer = new RingBuffer(sharedBuffer, Float32Array);
        }
    }
    process(inputs, outputs) {
        // By default, the node has single input and output.

	if (!this.ringBuffer) {
	    return true;
	}
	if (inputs[0].length == 0) {
	    return true;
	}

	for (var i=0; i < 128; i++) {
	    this.buf[i] = inputs[0][0][i];
	}
        // console.log("DEBUG: sender-worklet: Copied data " + this.ringBuffer.available_write());
        if (this.ringBuffer.available_write() >= this.buf.length) {
            // console.log("DEBUG: sender-worklet: pushing to decodedBuffer");
	    this.ringBuffer.push(this.buf);
	}

	return true;
    }
}

try {
    registerProcessor('sender-worklet-processor', SenderWorkletProcessor);
} catch (err) {
    console.log("WARNING: registierProcessor failed for 'SenderWorkletProcessor'");
    console.log(err);
}
