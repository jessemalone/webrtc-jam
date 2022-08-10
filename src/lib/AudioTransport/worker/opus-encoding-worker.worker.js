// import 'core-js/stable'
// import 'regenerator-runtime/runtime'
import { RingBuffer } from 'ringbuf.js'
import { Transcoder } from '../Transcoder'
import { OpusscriptAdapter } from '../OpusscriptAdapter'

var OpusScript = require("opusscript");

var encodedRingBuffer
var decodedRingBuffer
var sampleRate
var frameSize
var channels
var opusscript
var encoder
var transcoder
var running = false;

// TODO july 31 2022 - is this more test specifics
// breaking the browser?
// if (onmessage == undefined) {
//     var onmessage;
// }
onmessage = (e) => {
    if (e.data.type == "init") {
        console.debug("DEBUG: opus encoding worker - init started");
        // Shared buffer with raw audio to be encoded
        // TODO: March 11 - Input/output have different types
        // depending on whether it's encoding or decoding! Duh.
        let encodedBuffer = e.data.encodedBuffer
        encodedRingBuffer = new RingBuffer(encodedBuffer, Uint8Array)

        let decodedBuffer = e.data.decodedBuffer
        decodedRingBuffer = new RingBuffer(decodedBuffer, Float32Array)

        sampleRate = e.data.sampleRate
        frameSize = e.data.frameSize
        channels = e.data.channels

        opusscript = new OpusScript(sampleRate, channels, OpusScript.Application.RESTRICTED_LOWDELAY)
        encoder = new OpusscriptAdapter(opusscript, frameSize)
        transcoder = new Transcoder(encoder, frameSize);

        postMessage({type: "ready", value: true});
                                     
    } else if (e.data.type == "encode") {
        // start processing
        running = true;
        encode();
    } else if (e.data.type == "decode") {
        // start processing
        running = true;
        decode();
    } else if (e.data.type == "stop") {
        running = false;
    }
};

function encode() {
    // while (running == true) {
    let i =    setInterval(() => {
            try {
                transcoder.encodeBuffer(decodedRingBuffer, encodedRingBuffer);
            } catch (e) {
                console.error("ERROR: Encoder error" + e);
            }
        }, 0);
    // }                           // 
    if (running != true) {
        clearInterval(i);
    }
}

function decode() {
    // while (running == true) {
    let i = setInterval(() => {
            try {
                transcoder.decodeBuffer(encodedRingBuffer, decodedRingBuffer);
            } catch (e) {
                console.error("ERROR: Decoder error" + e);
            }
        }, 0);
    if (running != true) {
        clearInterval(i);
    }
    // }
}

