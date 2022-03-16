import { RingBuffer } from "ringbuf.js";
import { Transcoder, compoundPacketFromBuffer} from "./Transcoder"
import { OpusEncoder } from '@discordjs/opus'
import { WaveFile } from 'wavefile'

import '@jest/globals'

var fft = require('fft-js').fft;
var fftUtil = require('fft-js').util;
let fs = require('fs');


let sampleRate = 48000;
let frameDuration = 120;
let channels = 1;
let frameSize = sampleRate * frameDuration / 1000;

function toInt16(buffer) {
    let result = new Int16Array(buffer.length);
    for (var i=0; i<buffer.length; i++) {
        let sample = buffer[i]
        result[i] = sample >= 0 ? sample * 32767 : sample * 32768;
    }

    return result
}
function toFloat32(buffer) {
    let result = new Float32Array(buffer.length);
    for (var i=0; i<buffer.length; i++) {
        let sample = buffer[i]
        result[i] = sample >= 0 ? sample / 32767 : sample / 32768;
    }

    return result
}

function generateSine(rate, freq) {
    let buffer = new Float32Array(frameSize*channels);
    for (var i=0; i<buffer.length; i++) {
        buffer[i] = Math.sin(i / (rate / (freq*Math.PI*2)))
    }

    return buffer;
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

function writeWav(filename, data) {
    let wav = new WaveFile();
    wav.fromScratch(channels, sampleRate, '16', toInt16(data));
    fs.writeFileSync(filename, wav.toBuffer());
}

function prepareEncodedBuffer(length, transcoder, testAudio) {
    let numPackets = length;
    let decodedBuf = RingBuffer.getStorageForCapacity(numPackets * frameSize, Float32Array);
    let decodedRingBuf = new RingBuffer(decodedBuf, Float32Array);
    let encodedBuf = RingBuffer.getStorageForCapacity(numPackets * frameSize, Uint8Array);
    let encodedRingBuf = new RingBuffer(encodedBuf, Uint8Array);

    let expectedEncodedSize = 0;
    for (var i = 0; i < numPackets; i++) {
        let packet = transcoder.encodePacket(testAudio);
        expectedEncodedSize += packet.length + 2;
        encodedRingBuf.push(new Uint8Array(new Int16Array([packet.length]).buffer));
        encodedRingBuf.push(packet);
    }
    expect(encodedRingBuf.available_read()).toBe(expectedEncodedSize);
    expect(decodedRingBuf.available_write()).toBeGreaterThan(0);

    return {"decodedRingBuffer": decodedRingBuf, "encodedRingBuffer": encodedRingBuf}
}

describe('compoundPacketFromBuffer', () => {
    let numPackets = 4;
    let freq = 440;
    let sampleRate = 48000;
    let testAudio = generateSine(sampleRate, freq);
    let opusEncoder = new OpusEncoder(sampleRate, channels);
    let transcoder = new Transcoder(opusEncoder, frameSize);
    let encodedBuffer;
    let sampleEncodedPacket;
    let sampleEncodedRingBuf
    let samplePacketLen;
    beforeEach(() => {
            // Pack a known number of packets into a buffer
            // ===========================================

            // get a sample packet
            let buffers = prepareEncodedBuffer(numPackets, transcoder, testAudio);
            let packetLenBytes = new Uint8Array(2);
            buffers["encodedRingBuffer"].pop(packetLenBytes);
            samplePacketLen = new Int16Array(packetLenBytes.buffer)[0];
            sampleEncodedPacket = new Uint8Array(samplePacketLen);

            buffers["encodedRingBuffer"].pop(sampleEncodedPacket);

            // Create a buffer with a known number copies of the sample packet
            let sampleEncodedBuf = RingBuffer.getStorageForCapacity(numPackets*(2+sampleEncodedPacket.length), Uint8Array);
            sampleEncodedRingBuf = new RingBuffer(sampleEncodedBuf, Uint8Array);
            for (var i=0;i<=numPackets;i++) {
                sampleEncodedRingBuf.push(packetLenBytes);
                sampleEncodedRingBuf.push(sampleEncodedPacket);
            }
    });
    describe('Given a buffer containing encoded packets and a length too small for all packets', () => {
        test('It returns a buffer containing only the complete packets', () => {
            // Get a compound packet from the encoded buffer
            let compoundPacket = compoundPacketFromBuffer(sampleEncodedRingBuf, sampleEncodedRingBuf.available_read() - 1);
            expect(compoundPacket.length).toBe((numPackets - 1) * (2 + samplePacketLen));
        });
        test('It decodes to audio that is shorter by one packet', () => {
            // Decode and compare the decoded Audio
            let compoundPacket = compoundPacketFromBuffer(sampleEncodedRingBuf, sampleEncodedRingBuf.available_read() - 1);
            let compoundBuf = RingBuffer.getStorageForCapacity(compoundPacket.length, Uint8Array);
            let compoundRingBuf = new RingBuffer(compoundBuf, Uint8Array);
            compoundRingBuf.push(compoundPacket);

            let decodedBuf = RingBuffer.getStorageForCapacity(numPackets * frameSize, Float32Array);
            let decodedRingBuf = new RingBuffer(decodedBuf, Float32Array);
            transcoder.decodeBuffer(compoundRingBuf, decodedRingBuf);

            // Decoded audio should be shorter than the original, since one packet was
            // incomplete
            expect(decodedRingBuf.available_read()).toBe((numPackets - 1) * testAudio.length);

            // Decoded audio should still be audible
            let decodedAudio = new Float32Array(numPackets*frameSize);
            decodedRingBuf.pop(decodedAudio);
            expect(fftMatch(testAudio, decodedAudio, sampleRate, 4)).toBe(true);
        });
        test("It leaves leftover packets in the original buffer", () => {
            let compoundPacket = compoundPacketFromBuffer(sampleEncodedRingBuf, sampleEncodedRingBuf.available_read() - 1);

            expect(sampleEncodedRingBuf.available_read()).toBe(samplePacketLen + 2);

            // the last packet should be decodeable and be audible
            let lastPacketBuf = new Uint8Array(samplePacketLen + 2);

            // Decode the last packet
            let decodedBuf = RingBuffer.getStorageForCapacity(frameSize, Float32Array);
            let decodedRingBuf = new RingBuffer(decodedBuf, Float32Array);
            let decodedAudio = new Float32Array(numPackets*frameSize);
            transcoder.decodeBuffer(sampleEncodedRingBuf,decodedRingBuf);

            // Decoded audio should still be audible
            decodedRingBuf.pop(decodedAudio);
            expect(fftMatch(testAudio, decodedAudio, sampleRate, 4)).toBe(true);
        });

    });
});

describe('OpusDecoder', () => {
    let opusEncoder;

    let testAudio;
    let encoderInput;

    beforeEach(() => {
        opusEncoder = new OpusEncoder(sampleRate, channels);

        let freq = 440;
        testAudio = generateSine(sampleRate, freq);
        encoderInput = toInt16(testAudio);
    });

    describe('.decodePacket', () => {
        test('decodes a single packet into a float32 array', () => {
            let transcoder = new Transcoder(opusEncoder, frameSize);

            let encodedPacket = opusEncoder.encode(encoderInput); 
            let decodedAudio = transcoder.decodePacket(encodedPacket);

            expect(fftMatch(testAudio, decodedAudio, sampleRate, 4)).toBe(true);
        });
    });

    describe('.encodePacket', () => {
        test('encodes a single packet from a float32 array', () => {
            let transcoder = new Transcoder(opusEncoder, frameSize);

            let encodedPacket = transcoder.encodePacket(testAudio);
            let decodedInt16 = new Int16Array(opusEncoder.decode(encodedPacket).buffer);

            expect(fftMatch(encoderInput, decodedInt16, sampleRate, 4)).toBe(true);
        });
    });

    describe('.decodeBuffer', () => {
        let transcoder;
        let numPackets;
        let decodedBuf;
        let decodedRingBuf;
        let encodedBuf;
        let encodedRingBuf;

        beforeEach(() => {
            numPackets = 4;

            transcoder = new Transcoder(opusEncoder, frameSize);
            let buffers = prepareEncodedBuffer(numPackets, transcoder, testAudio);
            decodedRingBuf = buffers["decodedRingBuffer"];
            encodedRingBuf = buffers["encodedRingBuffer"];
        });

        test('decodes from a buffer containing encoded packets', () => {
            transcoder.decodeBuffer(encodedRingBuf, decodedRingBuf);

            let decodedAudio = new Float32Array(numPackets*frameSize);
            decodedRingBuf.pop(decodedAudio);

            expect(fftMatch(testAudio, decodedAudio, sampleRate, 4)).toBe(true);
            expect(encodedRingBuf.available_read()).toBe(0);
        });

        test('leaves unprocessed packets in the input buffer when the output is full', () => {
            let shortenedOutputBuffer = RingBuffer.getStorageForCapacity((numPackets - 1) * frameSize, Float32Array);
            let shortenedOutputRingBuf = new RingBuffer(shortenedOutputBuffer, Float32Array);

            transcoder.decodeBuffer(encodedRingBuf, shortenedOutputRingBuf);
            let decodedAudio = new Float32Array(frameSize * channels);
            shortenedOutputRingBuf.pop(decodedAudio);

            // Examine the unread packet
            let leftoverPacketSizeBytes = new Uint8Array(2);
            encodedRingBuf.pop(leftoverPacketSizeBytes);
            let expectedLeftoverSize = new Int16Array(leftoverPacketSizeBytes.buffer)[0]

            expect(fftMatch(testAudio, decodedAudio, sampleRate, 4)).toBe(true);
            expect(encodedRingBuf.available_read()).toBe(expectedLeftoverSize);
        });
    });

    describe('.encodeBuffer', () => {
        let numPackets = 4;
        let audioBuffer;
        let audioRingBuffer;
        let encodedBuffer;
        let encodedRingBuffer;
        beforeEach(() => {
            audioBuffer = RingBuffer.getStorageForCapacity(numPackets*frameSize, Float32Array);
            audioRingBuffer = new RingBuffer(audioBuffer, Float32Array);
            encodedBuffer = RingBuffer.getStorageForCapacity(numPackets*frameSize, Uint8Array);
            encodedRingBuffer = new RingBuffer(encodedBuffer, Uint8Array);

            for (var i=0; i<numPackets-1; i++) {
                audioRingBuffer.push(testAudio);
            }

            let lastFrame = generateSine(sampleRate, 621);
            audioRingBuffer.push(lastFrame);
        });

        test('Encodes all audio in the input ring buffer and puts the encoded data on the output buffer', () => {
            let transcoder = new Transcoder(opusEncoder, frameSize);
            transcoder.encodeBuffer(audioRingBuffer, encodedRingBuffer);

            let outputBuffer = RingBuffer.getStorageForCapacity(numPackets*frameSize, Float32Array);
            let outputRingBuffer = new RingBuffer(outputBuffer, Float32Array);
            transcoder.decodeBuffer(encodedRingBuffer, outputRingBuffer);
            let decodedAudio = new Float32Array(frameSize * channels);
            outputRingBuffer.pop(decodedAudio);

            expect(fftMatch(testAudio, decodedAudio, sampleRate, 4)).toBe(true);
        });

        describe('when the encoded size of the input is larger than the output buffer', () => {
            test('it leaves the unprocessed audio in the input buffer', () => {
                let shortEncodedBuffer = RingBuffer.getStorageForCapacity(frameSize / 3, Uint8Array);
                let shortEncodedRingBuf = new RingBuffer(shortEncodedBuffer, Uint8Array);

                let transcoder = new Transcoder(opusEncoder, frameSize);
                transcoder.encodeBuffer(audioRingBuffer, shortEncodedRingBuf);

                // Check the unprocessed audio
                expect(audioRingBuffer.available_read()).toBeGreaterThan(frameSize);
                let nextUnprocessedFrame = new Float32Array(frameSize);
                audioRingBuffer.pop(nextUnprocessedFrame);
                expect(fftMatch(testAudio, nextUnprocessedFrame, sampleRate, 4)).toBe(true);

                // Check that the output buffer (shortEncodedRingBuf) doesn't have room
                // for the next frame
                let encodedNextFrame = transcoder.encodePacket(nextUnprocessedFrame);
                expect(shortEncodedRingBuf.available_write()).toBeLessThan(encodedNextFrame.length);
                
                // Check the contents of the decoded audio
                let outputBuffer = RingBuffer.getStorageForCapacity(numPackets*frameSize, Float32Array);
                let outputRingBuffer = new RingBuffer(outputBuffer, Float32Array);
                transcoder.decodeBuffer(shortEncodedRingBuf, outputRingBuffer);
                let decodedAudio = new Float32Array(frameSize * channels);
                outputRingBuffer.pop(decodedAudio);

                expect(fftMatch(testAudio, decodedAudio, sampleRate, 4)).toBe(true);
            });
        });
    });
});
