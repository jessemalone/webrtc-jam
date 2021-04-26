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
      const text = texts.join('');
      const blob = new Blob([text], {type: "application/javascript"});

      return URL.createObjectURL(blob);
    });
}

function AudioSender(audioContext) {
    let bufferLengthInMs = 50;
    let bufferLengthInSamples = audioContext.sampleRate / (1000 / bufferLengthInMs);
    this.context = audioContext;
    URLFromFiles(['/static/js/worklets/sender-worklet-processor.js', '/static/js/0.chunk.js']).then((u) => {
	this.context.audioWorklet.addModule(u).then((e) => {
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
