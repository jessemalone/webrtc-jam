import { OpusscriptAdapter } from './OpusscriptAdapter'
import {generateSine, fftMatch, writeWav, toInt16, toFloat32 } from './TestHelpers'

let frameDuration = 60;
let channels = 1;
let sampleRate = 48000;
let frameSize = sampleRate * frameDuration / 1000;

let OpusScript = require('opusscript');


function concat(buffer1, buffer2) {
    let result = new Uint8Array(buffer1.byteLength + buffer1.byteLength);
    result.set(new Uint8Array(buffer1.buffer), 0);
    result.set(new Uint8Array(buffer2.buffer), buffer1.byteLength)
    return result;
}
describe('OpusscriptAdapter', () => {
    test('constructor returns an instance, given frameSize', () => {

        let opusscript = new OpusScript(sampleRate, channels, OpusScript.Application.AUDIO)
        let osAdapter = new OpusscriptAdapter(opusscript, frameSize);
        expect(osAdapter.frameSize).toBe(frameSize);
        expect(osAdapter.opusscript).toBe(opusscript);
    });

    describe('encode/decode', () => {
        test('running encode and decode on sample audio, returns the same audio sample', () => {

            let opusscript = new OpusScript(sampleRate, channels, OpusScript.Application.AUDIO);
            let osAdapter = new OpusscriptAdapter(opusscript, frameSize);

            let sampleAudio = toInt16(generateSine(sampleRate, frameSize, channels, 440));

            let encodedPacket;
            try {
                encodedPacket = osAdapter.encode(sampleAudio);
            } catch(err) {
                expect(err).toBe(null);
            }

            let decodedPacket;
            try {
                decodedPacket = osAdapter.decode(encodedPacket);
            } catch(err) {
                expect(err).toBe(null);
            }
            let decodedPCM = new Int16Array(decodedPacket.buffer);

            let doubledInput = new Int16Array(concat(sampleAudio, sampleAudio).buffer)
            let doubledOutput = new Int16Array(concat(decodedPCM, decodedPCM).buffer)
            expect(fftMatch(doubledInput, doubledOutput, sampleRate, 4)).toBe(true);
        });
    });
});
