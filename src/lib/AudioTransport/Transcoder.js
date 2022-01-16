import { RingBuffer } from 'ringbuf.js'

function Transcoder(encoder, frameSize) {
    this.encoder = encoder;
    this.frameSize = frameSize;
};

function floatToInt(sample) {
    return sample >= 0 ? sample * 32767 : sample * 32768;
}

function intToFloat(sample) {
    return sample >= 0 ? sample / 32767 : sample / 32768
}

function intsToFloats(buf) {
    let result = new Float32Array(buf.length);
    for (var i=0; i<result.length;i++) {
        result[i] = intToFloat(buf[i]);
    }

    return result;
}

function floatsToInts(buf) {
    let result = new Int16Array(buf.length);
    for (var i=0; i<result.length;i++) {
        result[i] = floatToInt(buf[i]);
    }

    return result;
}


/*
  Pull all complete packets off the inputbuffer and decode into the output
  buffer, stopping if the output buffer is full
*/
Transcoder.prototype.decodeBuffer = function(inputRingBuffer, outputRingBuffer) {
    // let decoded = this.encoder.decode(buf);
    while (inputRingBuffer.available_read() >=2) {
        // Each packet is prepended by two bytes encoding its length
        let packetLenBytes = new Uint8Array(2);
        inputRingBuffer.pop(packetLenBytes);
        let packetLen = new Int16Array(packetLenBytes.buffer)[0];

        if (packetLen > 0 && outputRingBuffer.available_write() >= packetLen) {
            let packet = new Uint8Array(packetLen);
            inputRingBuffer.pop(packet);
            outputRingBuffer.push(this.decodePacket(packet));
        } else if (outputRingBuffer.available_write() < packetLen) {
            let tmpBuf = new Uint8Array(inputRingBuffer.available_read());
            inputRingBuffer.pop(tmpBuf);
            inputRingBuffer.push(packetLenBytes);
            inputRingBuffer.push(tmpBuf);
            break;
        }
    }
}

/*
  Encode all audio (float32) from the input buffer and encode as opus packets
  on the output buffer. Each packet is preceded by two bytes containing its
  size as an int16 value.
*/
Transcoder.prototype.encodeBuffer = function(inputRingBuffer, outputRingBuffer) {
    let inputBuf = new Float32Array(this.frameSize);
    while (inputRingBuffer.available_read() >= this.frameSize) {
        inputRingBuffer.pop(inputBuf);
        let packet = this.encodePacket(inputBuf);

        if (outputRingBuffer.available_write() >= packet.length + 2) {
            let packetLenBytes = new Uint8Array(new Int16Array([packet.length]).buffer);
            outputRingBuffer.push(packetLenBytes);
            outputRingBuffer.push(packet);
        } else {
            let remainder = new Float32Array(inputRingBuffer.available_read());
            inputRingBuffer.pop(remainder);
            inputRingBuffer.push(inputBuf);
            inputRingBuffer.push(remainder);
            break;
        }
    }
}

/*
  Decode a single packet, returning a float32 array
*/
Transcoder.prototype.decodePacket = function(packet) {
    /* Uint8Array */
    let decoded = this.encoder.decode(packet);
    let decodedInt16 = new Int16Array(decoded.buffer);

    return intsToFloats(decodedInt16);
}

Transcoder.prototype.encodePacket = function(floats) {
    let ints = floatsToInts(floats);
    let encoded = this.encoder.encode(ints);

    return encoded;
}


export { Transcoder }
