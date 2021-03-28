// This object provides methods to be called from WebRtcSession
// to add local streams or receive remote streams with an
// an implementation based on RTC data channels
function DataChannelAudioTransport(peerConnection, audioSender, audioReceiver) {
    this.peerConnection = peerConnection;
    this.audioSender = audioSender;
    this.audioReceiver = audioReceiver;

    this.mediaStreamDestination = this.audioReceiver.getMediaStreamDestination();
};

DataChannelAudioTransport.prototype.addStreamHandler = function(callback) {
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

    this.peerConnection.ondatachannel = (event) => {
	event.channel.onmessage = (event) => this.handleMessage(event);
    };

    callback(this.mediaStreamDestination);
};

DataChannelAudioTransport.prototype.addStream = function(mediaStreamSource) {
    // create shared buffer
    // create data channelk
    // start audio worklet
    // connect stream to audio worklet
    // pull audio from the buffer and send to data channel

};

DataChannelAudioTransport.prototype.handleMessage = function(message) {
    this.audioReceiver.receiveAudioSamples(message.data);
};

export {DataChannelAudioTransport}
