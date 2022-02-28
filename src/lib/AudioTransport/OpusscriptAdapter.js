function OpusscriptAdapter(opusscript, frameSize) {
    this.frameSize = frameSize;
    this.opusscript = opusscript;
}

OpusscriptAdapter.prototype.encode = function(samples) {
    return this.opusscript.encode(new Uint8Array(samples.buffer), this.frameSize); 
}

OpusscriptAdapter.prototype.decode = function(encodedPacket) {
    return this.opusscript.decode(encodedPacket);
}
export { OpusscriptAdapter }
