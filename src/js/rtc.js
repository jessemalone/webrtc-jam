'use strict'

export function createPeer(iceCandidateHandler) {
    const config = {
        iceServers: [
            {urls: ["stun:stun1.l.google.com:19302"]},
            {urls: ["stun:stun2.l.google.com:19302"]}
        ]
    }
    let localPeerConnection = new RTCPeerConnection(config)
    localPeerConnection.addEventListener('icecandidate', iceCandidateHandler);

    return localPeerConnection;
}

export function logError(error) {
  console.log("rtc error");
  console.log(error);
}
