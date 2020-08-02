import {Message} from './Message'
import {Peer} from './Peer'

function WebRtcSession(stream, signaller, options) {
    this.signaller = signaller;
    this.localStream = stream;
    this.peerConnections = [];
    this.options = options;

    this.signaller.addHandler("answer", this.getAnswerHandler());
    this.signaller.addHandler("offer", this.getOfferHandler());
    this.signaller.addHandler("announce", this.getAnnounceHandler());
    this.signaller.addHandler("ice", this.getIceCandidateHandler());
    this.signaller.addHandler("hangup", this.getHangupHandler());
}

WebRtcSession.prototype.onaddstream = function(event) {
}
WebRtcSession.prototype.onhangup = function(event) {
}

WebRtcSession.prototype.createRemoteStreamHandlerFor = function(peerId) {
    let addstream = this.onaddstream
    return(function(event) {
        addstream({peerId: peerId, stream: event.stream});
    });
}

WebRtcSession.prototype.getAnswerHandler = function() { 
    let that = this;
    return function(message) {
        console.log("GOT ANSWER");
        let answer = message.data;
        console.log(answer);

        // Find the right peer
        let peer = that.peerConnections.find( peer => peer.id === message.sender_guid);

        // Set up the peer
        peer.connection.setRemoteDescription(message.data);
        peer.connection.onaddstream = that.createRemoteStreamHandlerFor(message.sender_guid);
    }
}

WebRtcSession.prototype.getOfferHandler = function() {
    let that = this;
    return function(message) {
        console.log("GOT OFFER");
        let offer = message.data
        console.log(offer);

        // Create peer connection
        let newPeerConnection = that.createPeer(function(event) {
            // TODO: this should be implicit in createPeer
            console.log("offer sending ICE");
            that.signaller.send(new Message("ice",event.candidate,"",message.sender_guid));
        });

        // Add the local stream
        // (This needs to be added before creating and sending answer)
        // TODO: Replace with addTrack - addStream is deprecated
        newPeerConnection.addStream(that.localStream);

        // set the offer and answer handler
        newPeerConnection.setRemoteDescription(offer);
        newPeerConnection.createAnswer().then(function(answer) {
            console.log("sending answer");
            newPeerConnection.setLocalDescription(answer);
            that.signaller.send(new Message("answer",answer,"",message.sender_guid));
        });

        // Set up remote stream handler
        newPeerConnection.onaddstream = that.createRemoteStreamHandlerFor(message.sender_guid);

        // Add to the peer list
        let newPeer = new Peer(message.sender_guid, newPeerConnection);
        that.peerConnections.push(newPeer);
    }
}

WebRtcSession.prototype.getAnnounceHandler = function() {
    let that = this;
    return function(message) {
        console.log("GOT ANNOUNCE");
        // Create peer connection
        let newPeerConnection = that.createPeer(function(event) {
            console.log("announce sending ICE");
            that.signaller.send(new Message("ice",event.candidate,"",message.sender_guid))
        });

        // Add local stream to the connection
        newPeerConnection.addStream(that.localStream);

        // Create offer
        newPeerConnection.createOffer(that.options)
            .then(function(offer){
                newPeerConnection.setLocalDescription(offer);
                that.signaller.send(new Message("offer",offer,"",message.sender_guid));
            });

        // Add the peer to the peer list
        let newPeer = new Peer(message.sender_guid, newPeerConnection);
        that.peerConnections.push(newPeer);
    }
}

WebRtcSession.prototype.getIceCandidateHandler = function() {
    let that = this;
    return function(message) {
        console.log("GOT REMOTE ICE");
        let candidate = message.data;
        // Find the right peer
        let peer = that.peerConnections.find( peer => peer.id === message.sender_guid);

        // Add the ice candidate to the peer connection
        if (candidate != null) {
            var rtcIceCandidate = that.createRTCIceCandidate(candidate);
            peer.connection.addIceCandidate(rtcIceCandidate);
        }
    }
}

WebRtcSession.prototype.getHangupHandler = function() {
    let that = this;
    return function(message) {
        console.log("GOT HANGUP");
        let peerId = message.sender_guid;
        that.onhangup({peerId: peerId});

        // Remove the peer connection
        let peerIndex = that.peerConnections.findIndex( peer => peer.id === peerId);
        if (that.peerConnections[peerIndex]) {
            that.peerConnections[peerIndex].connection.close();
            that.peerConnections.splice(peerIndex, 1);
        }
    }
}

// TODO: This needs tests, and iceCandidateHandler should no longer be passed in
WebRtcSession.prototype.createPeer = function(iceCandidateHandler) {
    console.log("ENV");
    console.log(process.env);
    const config = {
        iceServers: [
            {urls: ["stun:stun1.l.google.com:19302"]},
            {urls: ["stun:stun2.l.google.com:19302"]},
            {urls: ["turn:" + process.env.REACT_APP_TURN_HOST],username: process.env.REACT_APP_TURN_USERNAME, credential:process.env.REACT_APP_TURN_PASSWORD}
        ]
    }
    let localPeerConnection = new RTCPeerConnection(config)
    localPeerConnection.addEventListener('icecandidate', iceCandidateHandler);

    return localPeerConnection;
}

WebRtcSession.prototype.createRTCIceCandidate = function(candidate) {
    return new RTCIceCandidate(candidate);
}

WebRtcSession.prototype.getStats = function(peerId) {
    let peer = this.peerConnections.find( peer => peer.id === peerId);

    if (peer) {
        return peer.connection.getStats();
    }
    else {
        return Promise.resolve(null);
    }
}

export {WebRtcSession}
