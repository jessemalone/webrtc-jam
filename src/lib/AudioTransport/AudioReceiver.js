// Given a MediaStreamDestination provide a method which will
// pipe audio to that stream

import { AudioWriter, RingBuffer } from 'ringbuf.js';

function AudioReceiver(audioContext) {
    let bufferLengthInMs = 50;
    let bufferLengthInSamples = audioContext.sampleRate / (1000 / bufferLengthInMs);
    this.context = audioContext;
    this.mediaStreamDestination = audioContext.createMediaStreamDestination();
    this.context.audioWorklet.addModule('receiver-worklet-processor.js').then((e) => {
	try {
	    let worklet = new AudioWorkletNode(this.context, 'receiver-worklet-processor');
	    // create shared buffer
	    console.log("DEBUG ===================================");
	    console.log(Float32Array.BYTES_PER_ELEMENT);
	    console.log(ArrayBuffer.__proto__.isPrototypeOf(Float32Array));
	    this.sharedBuffer = RingBuffer.getStorageForCapacity(bufferLengthInSamples, Float32Array);
	    this.ringBuffer = new RingBuffer(this.sharedBuffer, ArrayBuffer);
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

}

AudioReceiver.prototype.getMediaStreamDestination = function() {
    return this.mediaStreamDestination;
}

AudioReceiver.prototype.receiveAudioSamples = function(samples) {
    // enqueue samples to the buffer
    
}

export { AudioReceiver }
