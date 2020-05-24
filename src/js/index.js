'use strict';

import * as player from './player'
import * as rtc from './rtc'
import {Signaller} from './signaller'
import {Message} from './message'
import {Peer} from './peer'
import {SdpParams} from './sdp_params'

const mediaStreamConstraints = {
    audio: {
        autoGainContol: false,
        echoCancellation: false,
        latency: 0.005,
        noiseSuppression: false,
        channelCount: 1
    },
    video: false
}
const offerOptions = {
    offerToReceiveAudio: 1,
}


// Set up globals
let proto = "wss://";
let signaller;
let websocket;
let sdpParams = new SdpParams();
let peerConnections = [];
let remoteTracks = [];
let localStream;
let statsReportingInterval;

// TODO: this is our sender_guid for outgoing messages but isn't
//       really necessary. 
let localClientGuid = "";


function startWebsocket() {
    if (window.location.host == "localhost:8780") {
        proto = "ws://"
    }
    websocket = new WebSocket(proto + window.location.host + "/ws");
    signaller = new Signaller(websocket);
    
    signaller.setHandler("answer", answerHandler);
    signaller.setHandler("offer", offerHandler);
    signaller.setHandler("announce", announceHandler);
    signaller.setHandler("ice", iceHandler);
    signaller.setHandler("hangup", hangupHandler);
}

// Set up media stream handlers
function gotLocalMediaStream(stream) {
    console.log("MEDIA STREAM");
    console.log(stream.getTracks());
    // Add Player
    let tracks_container = document.getElementById("tracks");
    let track = player.addPlayer(tracks_container, false);
    let audio = track.querySelector('audio');
    audio.srcObject = stream;
    localStream = stream;

    // Announce!
    signaller.announce();
}

function createRemoteMediaStreamHandlerFor(peerId){
    return function(event) {
        console.log("got remote stream");
        // Add player
        let tracks_container = document.getElementById("tracks");
        let remoteTrack = player.addPlayer(tracks_container);
        let audio = remoteTrack.querySelector('audio')
        audio.srcObject = event.stream;
        remoteTracks.push({"peerId": peerId, "track": remoteTrack});
        };
}
function handleLocalMediaStreamError(error) {
    console.log(error);
}


// Listen for offers
function offerHandler(message) {
    console.log("GOT OFFER");

    let offer = message.data
    console.log(offer);

    // Create peer connection
    let newPeerConnection = rtc.createPeer(function(event) {
        console.log("offer sending ICE");
        signaller.send(new Message("ice",event.candidate,localClientGuid,message.sender_guid));
    });
 
    // Add the local stream
    // (This needs to be added before creating and sending answer)
    // TODO: Replace with addTrack - addStream is deprecated
    newPeerConnection.addStream(localStream);


    // set the offer and answer handler
    newPeerConnection.setRemoteDescription(offer);
    newPeerConnection.createAnswer().then(function(answer) {
        console.log("sending answer");
        newPeerConnection.setLocalDescription(answer);
        answer =rtc.mungeSDP(answer, sdpParams);
        signaller.send(new Message("answer",answer,localClientGuid,message.sender_guid));
    });
    
    // Set up remote stream handler
    newPeerConnection.onaddstream = createRemoteMediaStreamHandlerFor(message.sender_guid);

    // Add to the peer list
    let newPeer = new Peer(message.sender_guid, newPeerConnection);
    peerConnections.push(newPeer);
}


// Listen for answers
function answerHandler(message) {
    console.log("GOT ANSWER");
    let answer = message.data;
    console.log(answer);

    // Find the right peer
    let peer = peerConnections.find( peer => peer.id == message.sender_guid);

    // Set up the peer
    peer.connection.setRemoteDescription(message.data);
    peer.connection.onaddstream = createRemoteMediaStreamHandlerFor(message.sender_guid);
}


// Listen for announcements
//
function announceHandler(message) {
    console.log("GOT ANNOUNCE");
    // Create peer connection
    let newPeerConnection = rtc.createPeer(function(event) {
        console.log("announce sending ICE");
        signaller.send(new Message("ice",event.candidate,localClientGuid,message.sender_guid))
    });

    // Add local stream to the connection
    newPeerConnection.addStream(localStream);

    // Create offer
    newPeerConnection.createOffer(offerOptions)
        .then(function(offer){
            newPeerConnection.setLocalDescription(offer).then(()=>{}).catch(rtc.logError);
            offer =rtc.mungeSDP(offer, sdpParams);
            signaller.send(new Message("offer",offer,localClientGuid,message.sender_guid));
        }).catch(rtc.logError);

    // Add the peer to the peer list
    let newPeer = new Peer(message.sender_guid, newPeerConnection);
    peerConnections.push(newPeer);
}

// Listen for remote ICE
//
function iceHandler(message) {
    console.log("GOT REMOTE ICE");
    let candidate = message.data;
    // Find the right peer
    let peer = peerConnections.find( peer => peer.id == message.sender_guid);

    // Add the ice candidate to the peer connection
    if (candidate != null) {
        var rtcIceCandidate = new RTCIceCandidate(candidate);
        peer.connection.addIceCandidate(rtcIceCandidate);
    }
}

// Listen for peer hangups
// 
function hangupHandler(message) {
    console.log("GOT HANGUP");
    let peerId = message.sender_guid;

    // Remove the player for this stream
    let trackIndex = remoteTracks.findIndex( track => track.peerId == peerId);
    remoteTracks[trackIndex].track.remove();
    remoteTracks.splice(trackIndex, 1);
    
    // Remove the peer connection
    let peerIndex = peerConnections.findIndex( peer => peer.id == peerId);
    peerConnections[peerIndex].connection.close();
    peerConnections.splice(peerIndex, 1);
}

// Reset Connections
function resetConnections() {
    console.log("RESET");
    // Stop stats reporting
    websocket.onclose = function() {
        // Remove peerConnections
        for (var i in peerConnections) {
            peerConnections[i].connection.close();
        }
        peerConnections = [];

        // Remove tracks
        for (var i in remoteTracks) {
            remoteTracks[i].track.remove();
        }
        remoteTracks = [];
        
        startWebsocket();
        websocket.onopen = function() {
            signaller.announce();
        }
    };
    signaller = null;
    websocket.close("1000", "Connection reset requested");
}


// Set up stats
function createStatsHandlerForPeer(peer) {
    return function(report) {
        var remoteTrack = remoteTracks.find( track => track.peerId == peer.id);
        var latencyElement = remoteTrack.track.querySelector('#latency');
        report.forEach(function(entry) {
            if (entry.roundTripTime != null) {
                latencyElement.innerHTML = entry.roundTripTime;
            }
        });
    }
}
function startStatsReporting() {
    statsReportingInterval = setInterval(function() {
        let stats = "";
        for (var i in peerConnections) {
            // find the audio track
            var peer = peerConnections[i];
            peer.connection.getStats().then(createStatsHandlerForPeer(peer));
        }
    }, 1000);
}

// Set up codec params listener
function setCodecParams(event) {
    console.log("UPDATE SDP PARAMS");
    switch(event.target.id) {
        case 'rate':
            sdpParams.rate = event.target.value;
            break;
        case 'maxptime':
            sdpParams.maxptime = event.target.value;
            break;
        case 'ptime':
            sdpParams.ptime = event.target.value;
            break;
        case 'maxaveragebitrate':
            sdpParams.maxaveragebitrate = event.target.value;
            break;
        case 'stereo':
            sdpParams.stereo = event.target.value;
            break;
    }
    console.log(sdpParams);
    resetConnections();
};

// Handle codec parameter selection
document.querySelectorAll('select').forEach(function(element) {
    element.onchange = setCodecParams;
});
    
    
// ==================================================================//  
// ** START **
startWebsocket();
startStatsReporting();
websocket.onopen = function() {
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
        .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);
};

