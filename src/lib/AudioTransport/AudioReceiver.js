// Given a MediaStreamDestination provide a method which will
// pipe audio to that stream

import { RingBuffer } from 'ringbuf.js';
import Worker from "./worker/opus-encoding-worker.worker.js";

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

function AudioReceiver(audioContext) {
    let bufferLengthInMs = 120;
    let frameDurationMs = 5;
    let bufferLengthInSamples = audioContext.sampleRate / (1000 / bufferLengthInMs);
    this.frameSize = audioContext.sampleRate / (1000 / frameDurationMs);


    this.context = audioContext;
    console.log("=========AUDIO CONTEXT");
    console.log(this.context);
    this.mediaStreamDestination = audioContext.createMediaStreamDestination();
    this.averageReceivedSampleLength = bufferLengthInSamples;

    this.worker = new Worker();
    
    this.worklet = {};
    let ready = new Promise((resolve, reject) => {
	URLFromFiles(['/static/js/worklets/receiver-worklet-processor.js', '/static/js/ringbuf.js']).then((u) => {
	    this.context.audioWorklet.addModule(u).then((e) => {
		try {
		    this.worklet = new AudioWorkletNode(this.context, 'receiver-worklet-processor');
		    // create shared buffer
		    console.log("DEBUG ===================================");
		    console.log(Float32Array.BYTES_PER_ELEMENT);
		    console.log(ArrayBuffer.__proto__.isPrototypeOf(Float32Array));
		    // this.sharedBuffer = RingBuffer.getStorageForCapacity(bufferLengthInSamples, Float32Array);
		    // this.ringBuffer = new RingBuffer(this.sharedBuffer, Float32Array);
		    // this.audioWriter = new AudioWriter(this.ringBuffer);
		    // // initialize audio worklet processor
		    // worklet.port.postMessage({
		    //     type: "receive-buffer",
		    //     data: this.sharedBuffer
		    // });
                    console.log("SET lengths");
                    console.log(bufferLengthInSamples);
		    this.setBuffers(bufferLengthInSamples);
		    // connect the processor to mediaStreamDestination
		    this.worklet.connect(this.mediaStreamDestination);

                    // start decoding
                    this.worker.addEventListener('message', (e) => {
                        if (e.data.type == "ready" && e.data.value == true) {
                            console.log("Decoding worker ready");
                            this.worker.postMessage({type: "decode"});
                            console.log("Start decoding");
                        }
                    });
		    resolve(this);
		} catch (err) {
		    console.log("ERROR +=====");
		    console.log(err);
		    reject(err);
		}
	    });
	});
    });

    return(ready);
}

AudioReceiver.prototype.setBuffers = function(bufferLengthInSamples) {
    console.log("SET BUFFERS");
    console.log(bufferLengthInSamples);
    this.decodedSharedBuffer = RingBuffer.getStorageForCapacity(bufferLengthInSamples, Float32Array);
    this.decodedRingBuffer = new RingBuffer(this.decodedSharedBuffer, Float32Array);
    this.encodedSharedBuffer = RingBuffer.getStorageForCapacity(bufferLengthInSamples, Uint8Array);
    this.inputRingBuffer = new RingBuffer(this.encodedSharedBuffer, Uint8Array);
    // this.audioWriter = new AudioWriter(this.ringBuffer);
    // initialize audio worklet processor
    this.worklet.port.postMessage({
	type: "receive-buffer",
	data: this.decodedSharedBuffer
    });

    this.worker.postMessage({
        type: "init",
        encodedBuffer: this.encodedSharedBuffer,
        decodedBuffer: this.decodedSharedBuffer,
        sampleRate: this.context.sampleRate,
        frameSize: this.frameSize,
        channels: this.context.channels,
    });
}

AudioReceiver.prototype.getMediaStreamDestination = function() {
    return this.mediaStreamDestination;
}

AudioReceiver.prototype.getAverageReceivedLength = function(length) {
    // return a rolling average over received sets of sample
    return (this.averageReceivedSampleLength * 3999 + length) / 4000;
}

AudioReceiver.prototype.receiveAudioSamples = function(blob) {
    // enqueue samples to the buffer
    // (samples come in as a blob and must be converted to arraybuffer
    new Response(blob).arrayBuffer().then((buf) => {
        // console.log("DEBUG: AudioReceiver got input");
	let samples = new Uint8Array(buf);
	// this.averageReceivedSampleLength = this.getAverageReceivedLength(samples.length)

        // YOU ARE HERE MARCH 13: Probably need buffer size optimization
        while ( this.inputRingBuffer.available_write() < samples.length ) {
            console.debug("DEBUG: AudioReceiver.receiveAudioSamples: buffer overrun, waiting. len:" + this.inputRingBuffer.available_write() + "samples: " + samples.length);
        }
	if (this.inputRingBuffer.available_write() >= samples.length) {
	    this.inputRingBuffer.push(samples);
	} else {
            console.debug("DEBUG: AudioReceiver.receiveAudioSamples: buffer overrun, waiting. len:" + this.inputRingBuffer.available_write() + "samples: " + samples.length);
        }
	// else if (this.ringBuffer.available_write() <= 2*this.averageReceivedSampleLength) {
	//     // console.log("DEBUG: Buffer overrun - growing buffer");
	//     // console.log("DEBUG: samples length" + String(samples.length));
	//     // console.log("DEBUG: average" + String(this.averageReceivedSampleLength));
	//     // console.log("DEBUG: available write" + String(this.audioWriter.available_write()));
	//     let currentLength = this.ringBuffer.capacity();
	//     let newLength = currentLength + samples.length;
	//     this.setBuffers(newLength);
	//     let newMs = 1000 / (this.context.sampleRate / newLength);
	//     // console.log("DEBUG: New buffer length in ms: " + String(newMs));
	// }
	// else if (this.ringBuffer.available_write() > 4*this.averageReceivedSampleLength) {
	//     let currentLength = this.ringBuffer.capacity();
	//     let newLength = currentLength - samples.length;
	//     let newMs = 1000 / (this.context.sampleRate / newLength);
	//     if (newMs > 20) { 
	// 	// console.log("DEBUG: shrinking buffer");
	// 	// console.log("DEBUG: samples length" + String(samples.length));
	// 	// console.log("DEBUG: average" + String(this.averageReceivedSampleLength));
	// 	// console.log("DEBUG: available write" + String(this.audioWriter.available_write()));
	// 	this.setBuffers(newLength);
	// 	// console.log("DEBUG: New buffer length in ms: " + String(newMs));
	//     }
	// }
    });
}

export { AudioReceiver }
