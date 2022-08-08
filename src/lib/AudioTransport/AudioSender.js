// Given a MediaStreamSource provide a method which will send
// audio samples from that stream to a callback

// TODO: Mar 3: OpusScript tries fetching the wasm file from web root `/...wasm.wasm`. Figure out how to make it fetch from static/js...
import { RingBuffer } from 'ringbuf.js';
import Worker from "./worker/opus-encoding-worker.worker.js";
import * as transcoder from './Transcoder';

// TODO: This should be defined in common with AudioReceiver, (URLFromFiles too)
function BufferParamsFromURL(urlstring) {
    let url = new URL(urlstring);
    return {
        SenderInputMS: url.searchParams.get("SenderInputMS"), 
        SenderEncodedBytes: url.searchParams.get("SenderEncodedBytes"), 
        SenderFrameMS: url.searchParams.get("SenderFrameMS") 
    }
}

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

// YOU ARE HERE: March 14 - Data Channel is working but startup
//               is unreliable, needs investigation. Then need to
//               tune buffer/frame sizes to find out what's optimal
//
//               Also consider using requestAnimationFrame() instead of setInterval
//               to control the send loop
//
//               There's also a bug in compoundPacketFromBuffer - it leaves the trailing
//               packet without a length. Need to put the length back after reading
function AudioSender(audioContext) {
    let bufferParams = BufferParamsFromURL(window.location.href);
    let bufferLengthInMs = bufferParams.SenderInputMS;
    let frameDurationMs = bufferParams.SenderFrameMS;
    this.outputBufferLength = bufferParams.SenderEncodedBytes; // Bytes of encoded audio

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
    // The audio worklet puts raw audio from the mic into a buffer
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

    // start the encoding worker when it's ready
    this.worker.addEventListener('message', (e) => {
        console.debug("DEBUG: got message from encoding worker " + e.data);
        if (e.data.type == "ready" && e.data.value == true) {
            console.log("Encoding worker ready");
            this.worker.postMessage({type: "encode"})
            console.log("Start encoding");
        }
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


    this.interval = setInterval(() => {
        // TODO: July 31 2022 - You are here. Relying on setInterval is a huge problem.
        // TODO: consider looping this to deal with unreliable setInterval
        //       in background tabs. There's definitely a way, zoom uses datachannel
        //       and works in the background

        // Or try recursively calling Promises: And/or try requestAnihttps://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/mationFrame
        // Hmmm playing back audio even with volume down seems to get around this too, so maybe mute
        // should not ever stop playback, just lower volume
        if (this.encodedRingBuffer.available_read() > 0) {
            // console.log("DEBUG: Sender encodedRingBuffer Buffer full, sending:" + this.encodedRingBuffer.available_read());
            let buf = transcoder.compoundPacketFromBuffer(this.encodedRingBuffer, this.outputBufferLength);
	    callback(buf);
	} else {
            // console.debug("DEBUG: Sender encodedRingBuffer still filling, length:" + this.encodedRingBuffer.available_read());
        }
    }, 5);
};


AudioSender.prototype.stop = function() {
    // YOU ARE HERE March 21 2022: need to stop sending when the datachannel closes. This
    // probably gets called from webrtcsession, or DataChannelAudioTransport
    clearInterval(this.interval)
}

export {AudioSender}
