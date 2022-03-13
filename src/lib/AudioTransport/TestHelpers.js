import { WaveFile } from 'wavefile'

var fft = require('fft-js').fft;
var fftUtil = require('fft-js').util;
let fs = require('fs');

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

function generateSine(rate, frameSize, channels, freq) {
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

function writeWav(filename, channels, sampleRate, data) {
    let wav = new WaveFile();
    wav.fromScratch(channels, sampleRate, '16', toInt16(data));
    fs.writeFileSync(filename, wav.toBuffer());
}

export { generateSine, writeWav, fftMatch, toInt16, toFloat32 }
