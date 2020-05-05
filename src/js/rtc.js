'use strict'

function logIce(event) {
    const peerConnection = event.target;
    const iceCandidate = event.candidate;
    console.log("ICE Candidate:");
    console.log(iceCandidate);
}

export function createPeer() {
    // Local Peer Connection
    const config = {
        iceServers: [
            {urls: ["stuns:stun1.l.google.com:19302"]},
            {urls: ["stuns:stun2.l.google.com:19302"]}
        ]
    }
    let localPeerConnection = new RTCPeerConnection(config)
    localPeerConnection.addEventListener('icecandidate', logIce);
    //localPeerConnection.addEventListener('iceconnectionstatechange', handleConnectionStateChange);

    return localPeerConnection;
}

export function logError(error) {
  console.log("rtc error");
  console.log(error);
}

function createdOfferCallback(offer) {

}

function createOffer(peerConnection, options) {
    peerConnection.createOffer(options)
        .then(createdOfferCallback).catch(handleOfferError);
}

