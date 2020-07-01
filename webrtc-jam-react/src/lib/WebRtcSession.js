'use strict'

import {Message} from './Message'
import {Peer} from './Peer'

function WebRtcSession(stream, signaller, options, sdpParams) {
    this.signaller = signaller;
    this.localStream = stream;
    this.peerConnections = [];
    this.sdpParams = sdpParams;
    this.options = options;

    this.signaller.setHandler("answer", this.handleAnswer);
    this.signaller.setHandler("offer", this.handleOffer);
    this.signaller.setHandler("announce", this.handleAnnounce);
    this.signaller.setHandler("ice", this.handleIceCandidate);
    this.signaller.setHandler("hangup", this.handleHangup);
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

WebRtcSession.prototype.mungeSDP = function(offer, sdpParams) {
    console.log("MUNGE!");

    // munge the SDP
    if (sdpParams.rate != "") {
        offer.sdp = offer.sdp.replace(/maxplaybackrate=\d*;/,"");
        offer.sdp = offer.sdp.replace("useinbandfec=1","maxplaybackrate=" + sdpParams.rate + ";useinbandfec=1");
    }
    if (sdpParams.stereo != "") {
        console.log("MUNGE STEREO");
        offer.sdp = offer.sdp.replace(/stereo=\d*;/,"");
        offer.sdp = offer.sdp.replace("useinbandfec=1","stereo=" + sdpParams.stereo + ";useinbandfec=1");
    }
    if (sdpParams.maxptime != "") {
        offer.sdp = offer.sdp.replace("useinbandfec=1\r\n","useinbandfec=1\r\na=maxptime:" + sdpParams.maxptime + "\r\n");
    }
    if (sdpParams.ptime != "") {
        offer.sdp = offer.sdp.replace("useinbandfec=1\r\n","useinbandfec=1\r\na=ptime:" + sdpParams.ptime + "\r\n");
    }
    if (sdpParams.maxaveragebitrate != "") {
        offer.sdp = offer.sdp.replace("useinbandfec=1","maxaveragebitrate=" + sdpParams.maxaveragebitrate + ";useinbandfec=1");
    }
    if (sdpParams.useinbandfec != "") {
        console.log("MUNGE USEINBANDFEC");
        console.log(sdpParams);
        offer.sdp = offer.sdp.replace(/useinbandfec=\d/,"useinbandfec=" +  sdpParams.useinbandfec);
    }
    console.log(offer.sdp);
    return offer;
}

WebRtcSession.prototype.handleAnswer = function(message) {
    console.log("GOT ANSWER");
    let answer = message.data;
    console.log(answer);

    // Find the right peer
    let peer = this.peerConnections.find( peer => peer.id == message.sender_guid);

    // Set up the peer
    peer.connection.setRemoteDescription(message.data);
    peer.connection.onaddstream = this.createRemoteStreamHandlerFor(message.sender_guid);
}

WebRtcSession.prototype.handleOffer = function(message) {
    console.log("GOT OFFER");
    let offer = message.data
    console.log(offer);

    // Create peer connection
    let newPeerConnection = this.createPeer(function(event) {
        // TODO: this should be implicit in createPeer
        console.log("offer sending ICE");
        signaller.send(new Message("ice",event.candidate,localClientGuid,message.sender_guid));
    });
 
    // Add the local stream
    // (This needs to be added before creating and sending answer)
    // TODO: Replace with addTrack - addStream is deprecated
    newPeerConnection.addStream(this.localStream);

    // set the offer and answer handler
    newPeerConnection.setRemoteDescription(offer);
    let self = this;
    newPeerConnection.createAnswer().then(function(answer) {
        console.log("sending answer");
        newPeerConnection.setLocalDescription(answer);
        answer = self.mungeSDP(answer, self.sdpParams);
        self.signaller.send(new Message("answer",answer,"",message.sender_guid));
    });
    
    // Set up remote stream handler
    newPeerConnection.onaddstream = this.createRemoteStreamHandlerFor(message.sender_guid);

    // Add to the peer list
    let newPeer = new Peer(message.sender_guid, newPeerConnection);
    this.peerConnections.push(newPeer);
}

WebRtcSession.prototype.handleAnnounce = function(message) {
    console.log("GOT ANNOUNCE");
    // Create peer connection
    let newPeerConnection = this.createPeer(function(event) {
        console.log("announce sending ICE");
        signaller.send(new Message("ice",event.candidate,localClientGuid,message.sender_guid))
    });

    // Add local stream to the connection
    newPeerConnection.addStream(this.localStream);

    // Create offer
    let self = this;
    newPeerConnection.createOffer(this.options)
        .then(function(offer){
            newPeerConnection.setLocalDescription(offer);
            offer = self.mungeSDP(offer, self.sdpParams);
            self.signaller.send(new Message("offer",offer,"",message.sender_guid));
        });

    // Add the peer to the peer list
    let newPeer = new Peer(message.sender_guid, newPeerConnection);
    this.peerConnections.push(newPeer);
}
WebRtcSession.prototype.handleIceCandidate = function(message) {
    console.log("GOT REMOTE ICE");
    let candidate = message.data;
    // Find the right peer
    let peer = this.peerConnections.find( peer => peer.id == message.sender_guid);

    // Add the ice candidate to the peer connection
    if (candidate != null) {
        var rtcIceCandidate = this.createRTCIceCandidate(candidate);
        peer.connection.addIceCandidate(rtcIceCandidate);
    }
}
WebRtcSession.prototype.handleHangup = function(message) {
    console.log("GOT HANGUP");
    let peerId = message.sender_guid;
    this.onhangup({peerId: peerId});
    
    // Remove the peer connection
    let peerIndex = this.peerConnections.findIndex( peer => peer.id == peerId);
    this.peerConnections[peerIndex].connection.close();
    this.peerConnections.splice(peerIndex, 1);
}

// TODO: This needs tests, and iceCandidateHandler should no longer be passed in
WebRtcSession.prototype.createPeer = function(iceCandidateHandler) {
    const config = {
        iceServers: [
            {urls: ["stun:stun1.l.google.com:19302"]},
            {urls: ["stun:stun2.l.google.com:19302"]},
            {urls: ["turn:" + TURN_HOST],username: TURN_USERNAME, credential:TURN_PASSWORD}
        ]
    }
    let localPeerConnection = new RTCPeerConnection(config)
    localPeerConnection.addEventListener('icecandidate', iceCandidateHandler);

    return localPeerConnection;
}

WebRtcSession.prototype.createRTCIceCandidate = function(object) {
        return new RTCIceCandidate(candidate);
}

export {WebRtcSession}
