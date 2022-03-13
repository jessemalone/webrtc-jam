self.addEventListener('message', (e) => {
    if (e.data.type == "init") {
        // Shared buffer with raw audio to be encoded
        let inputBuffer = e.data.inputBuffer
        this.inputRingBuffer = new RingBuffer(inputBuffer, Float32Array)

        let outputBuffer = e.data.outputBuffer
        this.outputRingBuffer = new RingBuffer(outputBuffer, Uint8Array)

        this.sampleRate = e.data.sampleRate
        this.frameSize = e.data.frameSize
        this.channels = e.data.channels
    } else if (e.data.type == "encode") {
        // start processing
        this.running = true;
        this.encode();
    } else if (e.data.type == "decode") {
        // start processing
        this.running = true;
        this.decode();
    } else if (e.data.type == "stop") {
        this.running = false;
    }
});

self.encode = () => {
    let encoder = new OpusEncoder(this.sampleRate, this.channels);
    let transcoder = new Transcoder(encoder, this.frameSize);
    while (this.running == true) {
        transcoder.encodeBuffer(this.inputRingBuffer, this.outputRingBuffer);
    }
}

self.decode = () => {
    let encoder = new OpusEncoder(this.sampleRate, this.channels);
    let transcoder = new Transcoder(encoder, this.frameSize);
    while (this.running == true) {
        transcoder.decodeBuffer(this.inputRingBuffer, this.outputRingBuffer);
    }
}
