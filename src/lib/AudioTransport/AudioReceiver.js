// Given a MediaStreamDestination provide a method which will
// pipe audio to that stream

import { AudioWriter } from 'ringbuf.js';

function AudioReceiver(audioContext) {
    this.context = audioContext;
    this.mediaStreamDestination = audioContext.createMediaStreamDestination();
    this.context.audioWorklet.addModule('receiver-worklet-processor.js').then((e) => {
	let node = new AudioWorkletNode(this.context, 'receiver-worklet-processor');
    });
    // create shared buffer
    // initialize audio worklet processor
    // connect the processor to mediaStreamDestination
}

AudioReceiver.prototype.getMediaStreamDestination = function() {
    return this.mediaStreamDestination;
}

AudioReceiver.prototype.receiveAudioSamples = function(samples) {
    // enqueue samples to the buffer
    
}

export { AudioReceiver }
