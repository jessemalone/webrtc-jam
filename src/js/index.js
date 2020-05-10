'use strict';

import * as player from './player'
import * as rtc from './rtc'
import {ICESignaller, RTCSignaller} from './signalling'

const mediaStreamConstraints = {
    audio: {
        autoGainContol: false,
        echoCancellation: false,
        latency: 0.1,
        noiseSuppression: false
    },
    video: false
}
let offerSignaller = new RTCSignaller(window.location.host);
let iceSignaller = new ICESignaller(window.location.host);
let localPeer;
let remotePeer;


function handleLocalMediaStreamError(error) {
    console.log(error);
}
function gotLocalMediaStream(stream) {
    // Add Player
    tracks = document.getElementById("tracks");
    let track = player.addPlayer(tracks);
    track.srcObject = stream;
    // Create peer connection
    localPeer = rtc.createPeer(function (event) {
        iceSignaller.sendIce(event);
    });
    localPeer.addStream(stream);
    //
    // Create offer
    const offerOptions = {
        offerToReceiveAudio: 1,
    }
    localPeer.createOffer(offerOptions)
        .then(function(offer){
            localPeer.setLocalDescription(offer).then(()=>{}).catch(rtc.logError);
        offerSignaller.sendOffer(offer);
        }).catch(rtc.logError);

}

function gotRemoteMediaStream(event) {
    console.log("got remote stream");
    // Set up ICE handling
    iceSignaller.onIce(function (ice) {
        console.log("GOT REMOTE ICE");
        if (ice  != null) {
            var candidate = new RTCIceCandidate(ice);
            localPeer.addIceCandidate(candidate);
        }
    });
    // Add player
    tracks = document.getElementById("tracks");
    let remoteTrack = player.addPlayer(tracks);
    remoteTrack.srcObject = event.stream;
}


offerSignaller.onOffer(function(offer) {
    console.log("GOT OFFER");

    // Create remote peer connection
    //let remotePeer = rtc.createPeer();

    window.localPeer = localPeer;
    window.offer = offer;
    console.log(offer.type);
    if (offer.type === "answer") {
        var sdp_id = offer.sdp.match(/o=.*/)[0];
        var local_sdp_id = localPeer.localDescription.sdp.match(/o=.*/)[0];
        if (sdp_id != local_sdp_id) {
            console.log("got an answer");
            localPeer.setRemoteDescription(offer);
            localPeer.onaddstream = gotRemoteMediaStream
        }
    } else if (offer.type === "offer") {
        var sdp_id = offer.sdp.match(/o=.*/)[0];
        var local_sdp_id = localPeer.localDescription.sdp.match(/o=.*/)[0];

        if (sdp_id != local_sdp_id) {
            console.log("got remote offer");
            localPeer.setRemoteDescription(offer);
            localPeer.createAnswer().then(function(answer) {
                console.log("sending answer");
                localPeer.setLocalDescription(answer);
                offerSignaller.sendOffer(answer);
            });
            localPeer.onaddstream = gotRemoteMediaStream
        }

    }


    //remotePeer.addStream(stream);
  
});

navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);

