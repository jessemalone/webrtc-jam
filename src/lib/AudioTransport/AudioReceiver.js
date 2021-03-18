// Given a MediaStreamDestination provide a method which will
// pipe audio to that stream

function AudioReceiver(audioContext) {
    this.context = audioContext;
    this.mediaStreamDestination = audioContext.createMediaStreamDestination();
    // create shared buffer
    // initialize audio worklet processor
    // connect the processor to mediaStreamDestination
}

AudioReceiver.prototype.receiveAudioSamples = (samples) => {
    // enqueue samples to the buffer
}
