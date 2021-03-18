// This object provides methods to be called from WebRtcSession
// to add local streams or receive remote streams with an
// an implementation based on RTC data channels
function DataChannelAudioTransport(peerConnection, audioSender, audioReceiver) {
    this.peerConnection = peerConnection;
    this.audioSender = audioSender;
    this.audioReceiver = audioReceiver;
}

DataChannelAudioTransport.prototype.addStreamHandler = (callback) => {
    // add listener for datachannel event
    //
    // On datachannel
    //      create shared buffer
    //      create mediaStreamDestination
    //      create audio worklet
    //      pass buffer to worklet
    //      connect worklet to the stream
    //      in the worklet pull audio from the buffer
    //        and onto the output
    //      call the callback, passing in the mediaStreamDestination

};

DataChannelAudioTransport.prototype.addStream = (mediaStreamSource) => {
    // create shared buffer
    // create data channelk
    // start audio worklet
    // connect stream to audio worklet
    // pull audio from the buffer and send to data channel

};

