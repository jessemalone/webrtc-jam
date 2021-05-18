// Given a MediaStreamDestination provide a method which will
// pipe audio to that stream

import { AudioWriter, RingBuffer } from 'ringbuf.js';

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
    let bufferLengthInMs = 50;
    let bufferLengthInSamples = audioContext.sampleRate / (1000 / bufferLengthInMs);
    this.context = audioContext;
    this.mediaStreamDestination = audioContext.createMediaStreamDestination();

    URLFromFiles(['/static/js/worklets/receiver-worklet-processor.js', '/static/js/ringbuf.js']).then((u) => {
	this.context.audioWorklet.addModule(u).then((e) => {
	    try {
		let worklet = new AudioWorkletNode(this.context, 'receiver-worklet-processor');
		// create shared buffer
		console.log("DEBUG ===================================");
		console.log(Float32Array.BYTES_PER_ELEMENT);
		console.log(ArrayBuffer.__proto__.isPrototypeOf(Float32Array));
		this.sharedBuffer = RingBuffer.getStorageForCapacity(bufferLengthInSamples, Float32Array);
		this.ringBuffer = new RingBuffer(this.sharedBuffer, Float32Array);
		this.audioWriter = new AudioWriter(this.ringBuffer);
		// initialize audio worklet processor
		worklet.port.postMessage({
		    type: "receive-buffer",
		    data: this.sharedBuffer
		});
		// connect the processor to mediaStreamDestination
		worklet.connect(this.mediaStreamDestination);
	    } catch (err) {
		console.log("ERROR +=====");
		console.log(err);
	    }
	});
    });


}

AudioReceiver.prototype.getMediaStreamDestination = function() {
    return this.mediaStreamDestination;
}

AudioReceiver.prototype.receiveAudioSamples = function(samples) {
    // enqueue samples to the buffer
    // (samples come in as a blob and must be converted to arraybuffer
    if (this.audioWriter.available_write() >= 128) {
	samples.arrayBuffer().then((buf) => {
	    this.audioWriter.enqueue(new Float32Array(buf));
	});
    }
}

export { AudioReceiver }
