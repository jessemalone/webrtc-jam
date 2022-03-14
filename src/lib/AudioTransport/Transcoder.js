
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

function compoundPacketFromBuffer(encodedRingBuffer, length) {
    // console.log("encoded len: " + encodedBuffer.length);
    console.log("available: "+ encodedRingBuffer.available_read());
    console.log("requested len: "+ length);
    if (encodedRingBuffer.available_read() < 2) {
        return new Uint8Array(0);
    }

    let outputBuffer = new Uint8Array(length);

    console.log("available: "+ encodedRingBuffer.available_read());
    console.log("requested len: "+ length);
    let i = 0;
    while (i+2 < length && 2 <= encodedRingBuffer.available_read()) {
        encodedRingBuffer.pop(outputBuffer, 2, i);
        let packetLenBytes = outputBuffer.slice(i,i+2);
        let packetLen = new Int16Array(packetLenBytes.buffer)[0];
        i += 2;

        console.log("packet len: " + packetLen);
        if (i + packetLen < length && packetLen <= encodedRingBuffer.available_read()) {
            encodedRingBuffer.pop(outputBuffer,packetLen,i);
            i += packetLen;
        } else {
            i -= 2;
            break;
        }
    }

    // outputStorageBuffer = encodedBuffer.slice(0,i);
    // console.log("last index " + i);
    return outputBuffer.slice(0,i);
}

/*
  Pull all complete packets off the inputbuffer and decode into the output
  buffer, stopping if the output buffer is full
*/
let i = 0
Transcoder.prototype.decodeBuffer = function(inputRingBuffer, outputRingBuffer) {
    // let decoded = this.encoder.decode(buf);
    // i++;
    // if (i % 1000 == 1) {
    //     console.log("DEBUG: Transcoder.decodeBuffer available_read(): " + inputRingBuffer.available_read())
    // }
    while (inputRingBuffer.available_read() >=2) {
        // Each packet is prepended by two bytes encoding its length
        let packetLenBytes = new Uint8Array(2);
        inputRingBuffer.pop(packetLenBytes);
        let packetLen = new Int16Array(packetLenBytes.buffer)[0];

        // if (i % 1000 == 1) {
        //     console.log("DEBUG: Transcoder.decodeBuffer available_write(): " + outputRingBuffer.available_write())
        //     console.log("DEBUG: Transcoder.decodeBuffer packetLen: " + packetLen)
        // }

        if (packetLen > 0 && outputRingBuffer.available_write() >= packetLen) {
            let packet = new Uint8Array(packetLen);
            inputRingBuffer.pop(packet);
            try {
                let decodedPacket = this.decodePacket(packet);
                outputRingBuffer.push(decodedPacket);
            } catch (e) {
                console.error("Decoder error: " + e);
                // let tmpBuf = new Uint8Array(inputRingBuffer.available_read());
                // inputRingBuffer.pop(tmpBuf);
                // // inputRingBuffer.push(packetLenBytes);
                // inputRingBuffer.push(packet);
                // inputRingBuffer.push(tmpBuf);
            }
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

    // console.log("DEBUG: Transcoder.encodeBuffer available_read(), frameSize: " + inputRingBuffer.available_read() + ", " + this.frameSize)
    // TODO: cleanup
    let i = 0;
    while (inputRingBuffer.available_read() >= this.frameSize) {
        inputRingBuffer.pop(inputBuf);
        let packet = this.encodePacket(inputBuf);

        // i++;
        // if (i % 1000000 == 1) {
        //     console.log("DEBUG: Transcoder.encodeBuffer available_write(): " + outputRingBuffer.available_write())
        // }
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


export { Transcoder, compoundPacketFromBuffer }
