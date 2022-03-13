import { RingBuffer } from "ringbuf.js";
import { Transcoder} from "./OpusDecoder"
import { OpusEncoder } from '@discordjs/opus'
import { WaveFile } from 'wavefile'

import '@jest/globals'

function toInt16(sample) {
        return sample >= 0 ? sample * 32767 : sample * 32768;
}

function generateSine(size, rate, freq) {
    let buffer = new Float32Array(size);
    for (var i=0; i<buffer.length; i++) {
        buffer[i] = Math.sin(i / (rate / (freq*Math.PI*2)))
        // buffer[i] = Math.sin(i * Math.PI * 2 * rate / freq)
    }
}
function fftMatch(signal1, signal2, rate, desiredMatchingFreqs) {
    let windowSize = 4096;
    let phasors1 = fft(signal1.slice(0, windowSize));
    let freqs1 = fftUtil.fftFreq(phasors1, rate);
    let magnitudes1 = fftUtil.fftMag(phasors1);

    let phasors2 = fft(signal2.slice(0, windowSize));
    let freqs2 = fftUtil.fftFreq(phasors2, rate);
    let magnitudes2 = fftUtil.fftMag(phasors2);

    let topn1 = topmagnitudes(magnitudes1, desiredMatchingFreqs);
    let topn2 = topmagnitudes(magnitudes2, desiredMatchingFreqs);


    for (var i=0; i<topn1.length; i++) {
        if (freqs1[topn1[i]] != freqs2[topn2[i]]) {
            return false;
        }
    }
    return true;
}

function topmagnitudes(mags, k) {
    let result = new Array(k);
    for (var i=0; i<result.length; i++) {
        result[i] = 0;
    }
    
    for (var i=0; i<mags.length; i++) {
        for (var j=k-1; j>=0; j--) {
            if ((j==0 && mags[i] > mags[result[j]]) || (mags[i] > mags[result[j]] && mags[i] <= mags[result[j-1]])) {
                result[j] = i;
                break;
            }
        }
    }

    return result;
}

describe('OpusDecoder', () => {
    
    let Speaker = require('speaker');
    let OpusScript = require("opusscript")

    let sampleRate = 48000
    let frameDuration = 120;
    let channels = 1;
    let frameSize = sampleRate * frameDuration / 1000;


    let opusEncoder;

    beforeEach(() => {
        // audioBuf = RingBuffer.getStorageForCapacity(frameSize, Float32Array);
        // audioRingBuf = new RingBuffer(audioBuf, Float32Array);
        // dataBuf = RingBuffer.getStorageForCapacity(frameSize, Uint8Array);
        // dataRingBuf = new RingBuffer(dataBuf, Uint8Array);


        let freq = 440
        let audioData = new Float32Array(frameSize*channels);
        let intSamples = new Int16Array(frameSize*channels);
        testAudio = generateSine(frameSize,sampleRate, freq);

        let inputBuf = new Uint8Array(intSamples.buffer);
        const encoder = new OpusEncoder(sampleRate, channels);
        encoder.setBitrate(6000);
        let encodedAudio = encoder.encode(intSamples);
        let decodedAudio = new Uint8Array(frameSize*channels*2);
        decodedAudio.set(encoder.decode(encodedAudio));
        let decodedPCM = new Int16Array(decodedAudio.buffer);
        for (var i = 0;i < decodedPCM.buffer.length; i++) {
            decodedPCM.buffer[i] = decodedAudio.buffer[i];
        }

        // === OpusScript attempt
        // encodedAudio = opusscript.encode(audioData, frameSize);

        // console.log(encodedAudio);
        // let decodedBuf = opusscript.decode(encodedAudio);
        // let decodedArray = new Uint16Array(decodedBuf.buffer.slice(decodedBuf.byteOffset, decodedBuf.byteOffset + decodedBuf.byteLength));
        
        console.log(intSamples);
        // console.log(inputBuf.buffer);
        console.log(decodedPCM);

        // const speaker = new Speaker({
        //     channels: channels,
        //     bitDepth: 16,
        //     sampleRate: sampleRate,
        //     signed: true
        // });

        // Output to wav
        // CONCLUSION dec 30: the data in decodedPCM is fine, plays as a wave file.
        // Streaming to speaker is the issue.
        // let wav = new WaveFile();
        // wav.fromScratch(channels, sampleRate, '16', new Int16Array(decodedPCM.buffer));
        // fs.writeFileSync('/home/jesse/tmp/outtest.wav', wav.toBuffer());
        // // let inStream = streamify(Buffer.from(intSamples.buffer));
        // let decStream = streamify(Buffer.from(new Int16Array(decodedPCM.buffer)));
        // speaker.cork();
        // inStream.pipe(speaker);
        // decStream.pipe(speaker);
        // speaker.uncork();
        // // dataRingBuf.push(encodedAudio, encodedAudio.length);
    });

    // describe('.floatToInt16LE', () => {
    //     test('converts a float32 value to two byte Int16LE buffer', () => {
    //         let fl = 1.0
    //         let expectedInt = 32767
    //         let transcoder = new Transcoder(opusscript);


    //         let result = transcoder.floatToInt16LE(fl);


    //         expect(Buffer.from(result).readInt16LE()).toBe(expectedInt);
    //     });
    // });

    // describe('.floatToInt16LE', () => {
    //     test('converts a float32 to two bytes encoding a little endian int16', () => {
    //         let expectedFloat = 1.0
    //         let intbuf = Buffer.alloc(2)
    //         intbuf.writeInt16LE(32767);

    //         let transcoder = new Transcoder(opusscript);
    //         let result = transcoder.int16LEToFloat(intbuf);

    //         expect(result).toBe(expectedFloat);
    //     });
    // });
    // describe('.PcmFromFloat32Array', () => {
    //     test('convers at Float32Array to an int16le buffer', () => {
    //         let floatSamples = new Float32Array(120);
    //         let intSamples = new Int16Array(120);
    //         let freq = 2000
    //         let transcoder = new Transcoder(opusscript);
    //         generateSine(floatSamples, sampleRate, freq);
    //         for (var i = 0; i < intSamples.length; i++) {
    //             intSamples[i] = toInt16(floatSamples[i]);
    //         }
    //     });
    // });
    describe('.decodePacket', () => {
        test('decodes a single opus packet to a float32 buffer', () => {
            let transcoder = new Transcoder
            

        });
    });
    describe(".encodePacket", () => {

    });
});

