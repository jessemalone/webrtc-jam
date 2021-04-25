// Given a MediaStreamSource provide a method which will send
// audio samples from that stream to a callback

import {AudioReader, RingBuffer } from 'ringbuf.js';

function AudioSender(audioContext) {
    let bufferLengthInMs = 50;
    let bufferLengthInSamples = audioContext.sampleRate / (1000 / bufferLengthInMs);
    this.context = audioContext;
    this.context.audioWorklet.addModule('sender-worklet-processor.js').then((e) => {
	let worklet = new AudioWorkletNode(this.context, 'sender-worklet-processor');
	this.sharedBUffer = RingBuffer.getStorageForCapacity(bufferLengthInSamples, Float32Array);
	this.ringBuffer = new RingBuffer(this.sharedBUffer, Float32Array);
	
	worklet.port.postMessage({
	    type: "send-buffer",
	    data: this.sharedBuffer
	});
	// connect the processor to mediaStreamSource
	this.mediaStreamSource.connect(worklet);
    });

};

AudioSender.prototype.send = function(stream, callback) {
    let audioReader = new AudioReader(this.ringBuffer);
    let buf = new Float32Array(128);

    let render = () => {
	requestAnimationFrame(render);
	if (audioReader.available_read() >= 128) {
	    audioReader.dequeue(buf);
	    callback(buf);
	}
    }
    requestAnimationFrame(render);
};


export {AudioSender}
