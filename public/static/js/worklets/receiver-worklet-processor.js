
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
	    this.ringBuffer = new RingBuffer(sharedBuffer, Float32Array);
            this.outputBuffer = new Float32Array(sharedBuffer);
        }
    }
    process(inputs, outputs) {

        if (!this.ringBuffer) {
            console.log("DEBUG: receiver-worklet - not ready");
	    return true;
	}

        // console.log("DEBUG: receiver-worklet - called process: available_read()" + this.ringBuffer.available_read());
        if (this.ringBuffer.available_read() >= this.buf.length) {
            // console.log("DEBUG: receiver-worklet - reading a window");
            this.ringBuffer.pop(this.buf);

            for (var i=0;i < 128; i++) {
                outputs[0][0][i] = this.buf[i]
            }
        }
	return true;
    }
}

try {
    registerProcessor('receiver-worklet-processor', ReceiverWorkletProcessor);
} catch (err) {
    console.log("WARNING: registierProcessor failed for 'ReceiverWorkletProcessor'");
    console.log(err);
}
