// Given a MediaStreamSource provide a method which will send
// audio samples from that stream to a callback

function AudioSender(audioContext) {
    this.context = audioContext;
    this.mediaStreamSource = audioContext.createMediaStreamSource;
    // create shared buffer
    // initialize audio worklet processor
    // connect the processor to mediaStreamSource
};

AudioSender.prototype.send = function(callback) {
    // read audio from the shared buffer
    // call callback(audioSamples)
};

export {AudioSender}
