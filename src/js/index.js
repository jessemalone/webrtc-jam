'use strict';

import * as player from './player'
import * as rtc from './rtc'
import {Signaller} from './signaller'
import {Message} from './message'
import {Peer} from './peer'

const mediaStreamConstraints = {
    audio: {
        autoGainContol: false,
        echoCancellation: true,
        latency: 0.05,
        noiseSuppression: false,
        channelCount: 1
    },
    video: false
}

// Set up globals
let proto = "wss://";
if (window.location.host == "localhost:8780") {
    proto = "ws://"
}
let websocket = new WebSocket(proto + window.location.host + "/ws");
let signaller = new Signaller(websocket);
let peerConnections = [];
let remoteTracks = [];
let localStream;

// TODO: this is our sender_guid for outgoing messages but isn't
//       really necessary. 
let localClientGuid = "";


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
        let remoteTrack = player.addPlayer(tracks);
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
        signaller.send(new Message("answer",answer,localClientGuid,message.sender_guid));
    });
    
    // Set up remote stream handler
    newPeerConnection.onaddstream = createRemoteMediaStreamHandlerFor(message.sender_guid);

    // Add to the peer list
    let newPeer = new Peer(message.sender_guid, newPeerConnection);
    peerConnections.push(newPeer);
}

signaller.setHandler("offer", offerHandler);

// Listen for answers
function answerHandler(message) {
    console.log("GOT ANSWER");
    let answer = message.data;

    // Find the right peer
    let peer = peerConnections.find( peer => peer.id == message.sender_guid);

    // Set up the peer
    peer.connection.setRemoteDescription(message.data);
    peer.connection.onaddstream = createRemoteMediaStreamHandlerFor(message.sender_guid);
}
signaller.setHandler("answer", answerHandler);


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
    const offerOptions = {
        offerToReceiveAudio: 1,
    }

    newPeerConnection.createOffer(offerOptions)
        .then(function(offer){
            newPeerConnection.setLocalDescription(offer).then(()=>{}).catch(rtc.logError);
            signaller.send(new Message("offer",offer,localClientGuid,message.sender_guid));
        }).catch(rtc.logError);

    // Add the peer to the peer list
    let newPeer = new Peer(message.sender_guid, newPeerConnection);
    peerConnections.push(newPeer);
}
signaller.setHandler("announce", announceHandler);

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
signaller.setHandler("ice", iceHandler);

// Listen for peer hangups
// 
function hangupHandler(message) {
    console.log("GOT HANGUP");
    let peerId = message.sender_guid;

    // Remove the player for this stream
    let trackToRemove = remoteTracks.find( track => track.peerId == peerId);
    trackToRemove.track.remove();
    
    // Remove the peer connection
    let peerIndex = peerConnections.findIndex( peer => peer.id == peerId);
    peerConnections.splice(peerIndex, 1);
}
signaller.setHandler("hangup", hangupHandler);


// Get local media stream
websocket.onopen = function() {
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
        .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);
};


// Set up stats
setInterval(function() {
    let stats = "";
    for (var i in peerConnections) {
        // find the audio track
        var peer = peerConnections[i];
        var remoteTrack = remoteTracks.find( track => track.peerId == peer.id);
        peer.connection.getStats().then(function(report){
            report.forEach(function(entry) {
                if (entry.roundTripTime != null) {
                    var latencyElement = remoteTrack.track.querySelector('#latency');
                    latencyElement.innerHTML = entry.roundTripTime;
                }
            });
        }); 
    }
}, 1000);
