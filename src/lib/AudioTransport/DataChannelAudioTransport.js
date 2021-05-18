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
    //      setup datachannel event handling, passing data to the audioReceiver
    //      call the callback, passing in the mediaStreamDestination

    this.peerConnection.ondatachannel = (event) => {
	event.channel.onmessage = (event) => this.handleMessage(event);
    };

    callback(this.mediaStreamDestination);
};

// pass the stream to the audioSender, send resulting data to the datachannel
DataChannelAudioTransport.prototype.addStream = function(stream) {
    // DUH forgot to wait for "onopen" https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel#examples
    let dataChannel = this.peerConnection.createDataChannel("stream");
    // TODO: You are here May 11, is the anonymous call back not persisted? Perhaps define the callback on the datachannel object
    dataChannel.onopen = (e) => {
	this.audioSender.send(stream,function(data) {
	    dataChannel.send(data);
	});
    };
};

DataChannelAudioTransport.prototype.handleMessage = function(message) {
    this.audioReceiver.receiveAudioSamples(message.data);
};


export {DataChannelAudioTransport}
