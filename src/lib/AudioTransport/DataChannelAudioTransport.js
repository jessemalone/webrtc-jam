// This object provides methods to be called from WebRtcSession
// to add local streams or receive remote streams with an
// an implementation based on RTC data channels

import {AudioReceiver} from './AudioReceiver'
import {AudioSender} from './AudioSender'

function createAudioSender(audioContext) {
    return new AudioSender(audioContext);
}

function createAudioReceiver(audioContext) {
    return new AudioReceiver(audioContext);
}

function DataChannelAudioTransport(peerConnection, audioContext) {
    this.peerConnection = peerConnection;

    // Using exports. in order to mock these
    let audioSenderPromise = createAudioSender(audioContext);
    let audioReceiverPromise = createAudioReceiver(audioContext);

    let promise = new Promise((resolve, reject) => {
        Promise.all([audioSenderPromise, audioReceiverPromise]).then(p => {
            this.audioSender = p[0]
            this.audioReceiver = p[1]
            // TODO: REMOVE - NOT USED ANYMORE
            //this.mediaStreamDestination = this.audioReceiver.getMediaStreamDestination();
            resolve(this);
        })
    });

    return promise;
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

    callback(this.audioReceiver.getMediaStreamDestination());
};

// pass the stream to the audioSender, send resulting data to the datachannel
DataChannelAudioTransport.prototype.addStream = function(stream) {
    if (undefined !== this.dataChannel) {
        throw new Error("Multiple streams not implemented");
    }

    this.dataChannel = this.peerConnection.createDataChannel("stream");
    this.dataChannel.onopen = (e) => {
        console.log("DEBUG: DataChannelAudioTransport - got onopen");
	this.audioSender.send(stream,(data) => {
	    this.dataChannel.send(data);
	});
    };
};

DataChannelAudioTransport.prototype.close = function() {
    this.audioSender.stop();
}

DataChannelAudioTransport.prototype.handleMessage = function(message) {
    // console.log("DEBUG: DataChannelAudioTransport.handleMessage");
    this.audioReceiver.receiveAudioSamples(message.data);
};


export {createAudioSender, createAudioReceiver, DataChannelAudioTransport}
