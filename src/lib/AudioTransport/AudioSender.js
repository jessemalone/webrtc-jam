// Given a MediaStreamSource provide a method which will send
// audio samples from that stream to a callback

import {AudioReader, RingBuffer } from 'ringbuf.js';

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
    let bufferLengthInMs = 50;
    this.bufferLengthInSamples = audioContext.sampleRate / (1000 / bufferLengthInMs);
    this.context = audioContext;
    URLFromFiles(['/static/js/worklets/sender-worklet-processor.js', '/static/js/ringbuf.js']).then((u) => {
	this.context.audioWorklet.addModule(u).then((e) => {
	    this.worklet = new AudioWorkletNode(this.context, 'sender-worklet-processor');
	    this.sharedBuffer = RingBuffer.getStorageForCapacity(this.bufferLengthInSamples, Float32Array);
	    this.ringBuffer = new RingBuffer(this.sharedBuffer, Float32Array);

	    console.log("DEBUG sending sender buffer");
	    console.log(this.sharedBuffer);
	    
	    this.worklet.port.postMessage({
		type: "send-buffer",
		data: this.sharedBuffer
	    });
	});
    });

};

AudioSender.prototype.send = function(stream, callback) {
    let audioReader = new AudioReader(this.ringBuffer);
    let buf = new Float32Array(this.bufferLengthInSamples);

    // connect the processor to mediaStreamSource
    let mediaStreamSource = this.context.createMediaStreamSource(stream);
    mediaStreamSource.connect(this.worklet);
    this.worklet.connect(this.context.destination);

    let render = () => {
	requestAnimationFrame(render);
	console.log("DEBUG: available_read");
	console.log(audioReader.available_read());
	console.log(this.bufferLengthInSamples);
	if (audioReader.available_read() <= this.bufferLengthInSamples) {
	    audioReader.dequeue(buf);
	    callback(buf);
	}
    }
    requestAnimationFrame(render);
};


export {AudioSender}
