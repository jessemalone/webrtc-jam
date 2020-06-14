'use strict'
import {Message} from './message'

export function createPeer(iceCandidateHandler) {
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

export function mungeSDP(offer, sdpParams) {
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

export function logError(error) {
  console.log("rtc error");
  console.log(error);
}
