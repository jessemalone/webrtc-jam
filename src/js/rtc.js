'use strict'

// OOPS Need to do more than log it, need to
// addIceCandidate !!! AND send it via the websocket
function sendIceCandidate(event) {
    const peerConnection = event.target;
    const iceCandidate = event.candidate;
    console.log("ICE Candidate:");
    console.log(iceCandidate);
}

export function createPeer(iceCandidateHandler) {
    // Local Peer Connection
    const config = {
        iceServers: [
            {urls: ["stun:stun1.l.google.com:19302"]},
            {urls: ["stun:stun2.l.google.com:19302"]}
        ]
    }
    let localPeerConnection = new RTCPeerConnection(config)
    localPeerConnection.addEventListener('icecandidate', iceCandidateHandler);
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

