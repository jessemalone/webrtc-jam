// Given a MediaStreamSource provide a method which will send
// audio samples from that stream to a callback

// TODO: Mar 3: OpusScript tries fetching the wasm file from web root `/...wasm.wasm`. Figure out how to make it fetch from static/js...
import { RingBuffer } from 'ringbuf.js';
import Worker from "./worker/opus-encoding-worker.worker.js";
import * as transcoder from './Transcoder';

function URLFromFiles(files) {
  const promises = files
    .map((file) => fetch(file)
	 .then((response) => response.text()));

  return Promise
    .all(promises)
    .then((texts) => {
	const text = texts.join('').replace(/^.*exports.*$/mg,"");
      const blob = new Blob([text], {type: "application/javascript"});

      return URL.createObjectURL(blob);
    });
}

function AudioSender(audioContext) {
    let bufferLengthInMs = 20;
    let frameDurationMs = 10;
    this.outputBufferLength = 240;

    this.bufferLengthInSamples = audioContext.sampleRate / (1000 / bufferLengthInMs);
    this.frameSize = audioContext.sampleRate / (1000 / frameDurationMs);
    this.context = audioContext;

    this.worker = new Worker();
    let ready = new Promise((resolve, reject) => {
	URLFromFiles(['/static/js/worklets/sender-worklet-processor.js', '/static/js/ringbuf.js']).then((u) => {
	    this.context.audioWorklet.addModule(u).then((e) => {
		this.initialize();
		resolve(this);
	    });
	});
    });
    return ready;
};

AudioSender.prototype.initialize = function() {
    this.worklet = new AudioWorkletNode(this.context, 'sender-worklet-processor');
    this.decodedSharedBuffer = RingBuffer.getStorageForCapacity(this.bufferLengthInSamples, Float32Array);
    this.decodedRingBuffer = new RingBuffer(this.decodedSharedBuffer, Float32Array);

    this.encodedSharedBuffer = RingBuffer.getStorageForCapacity(this.outputBufferLength, Uint8Array);
    this.encodedRingBuffer = new RingBuffer(this.encodedSharedBuffer, Uint8Array);

    console.log("DEBUG sending sender buffer");
    
    this.worklet.port.postMessage({
	type: "send-buffer",
	data: this.decodedSharedBuffer
    });

    this.worker.postMessage({
        type: "init",
        decodedBuffer: this.decodedSharedBuffer,
        encodedBuffer: this.encodedSharedBuffer,
        sampleRate: this.context.sampleRate,
        frameSize: this.frameSize,
        channels: this.context.channels,
    });
}
AudioSender.prototype.send = function(stream, callback) {

    // connect the processor to mediaStreamSource
    let mediaStreamSource = this.context.createMediaStreamSource(stream);
    mediaStreamSource.connect(this.worklet);

    // start the encoder
    this.worker.addEventListener('message', (e) => {
        console.log("DEBUG: got message from worker");
        console.log(e.data);
        if (e.data.type == "ready" && e.data.value == true) {
            console.log("Encoding worker ready");
            this.worker.postMessage({type: "encode"})
            console.log("Start encoding");
        }
    });

    setInterval(() => {
        // TODO: YOU ARE HERE March 11: it gets stuck waiting for available write.
        //                               Somehow the buffer never drains completely
        //               Maybe some synchronization with the encoding worker - where
        //               it sends a signal when it's filled the buffer
        // console.log("DEBUG: AudioSender send interval, available_read(): " + this.encodedRingBuffer.available_read());

        if (this.encodedRingBuffer.available_read() > 0) {
            // console.log("DEBUG: Sender encodedRingBuffer Buffer full, sending:" + this.encodedRingBuffer.available_read());
            let buf = transcoder.compoundPacketFromBuffer(this.encodedRingBuffer, this.outputBufferLength);
	    callback(buf);
	} else {
            // console.debug("DEBUG: Sender encodedRingBuffer still filling, length:" + this.encodedRingBuffer.available_read());
        }
    }, 0);
};


export {AudioSender}
