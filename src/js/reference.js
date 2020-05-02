'use strict';

let offers_socket = new WebSocket("ws://localhost:8765/offer");
const mediaStreamConstraints = {
    audio:true,
    video: false
}

let localAudio = document.querySelector('#track1-audio');
let remoteAudio = document.querySelector('#track2-audio');

let localStream;
let remoteStream;


function handleLocalMediaStreamError(error) {
    console.log("error handling local stream" + error.toString());
}


function handleRemoteMediaStreamError(error) {
    console.log("error handling remote stream" + error.toString());
}

function getOtherPeer(peerConnection) {
    return (peerConnection === localPeerConnection) ? localPeerConnection : remotePeerConnection;
}
function handleConnection(event) {
    const peerConnection = event.target;
    const iceCandidate = event.candidate;
    

    if (iceCandidate) {
        const otherPeer = getOtherPeer(peerConnection);
        const newIceCandidate = new RTCIceCandidate(iceCandidate); 

        otherPeer.addIceCandidate(newIceCandidate).then(() => {
            handleConnectionSuccess(peerConnection);
        }).catch((error) => {

        });
    }

}

function handleConnectionStateChange(event) {
    const peerConnection = event.target;
    console.log('ICE state change: ' + event);
      console.log(`${getPeerName(peerConnection)} ICE state: ` +
        `${peerConnection.iceConnectionState}.`);
}

function gotLocalMediaStream(stream) {
    localStream = stream;
    localAudio.srcObject = stream;
    console.log("Got local media stream");

    // Local Peer Connection
    const servers = null
    localPeerConnection = new RTCPeerConnection(servers)
    localPeerConnection.addEventListener('icecandidate', handleConnection);
    localPeerConnection.addEventListener('iceconnectionstatechange', handleConnectionStateChange);

    // Remote Peer Connection
    remotePeerConnection = new RTCPeerConnection(servers)
    remotePeerConnection.addEventListener('icecandidate', handleConnection);
    remotePeerConnection.addEventListener('iceconnectionstatechange', handleConnectionStateChange);
    remotePeerConnection.addEventListener('addstream', gotRemoteMediaStream);

    // TODO: createdOffer
    localPeerConnection.createOffer(offerOptions)
        .then(createdOffer).catch(handleSetSessionDescriptionError);

    localPeerConnection.addStream(localStream);
}

function gotRemoteMediaStream(event) {
    const stream = event.stream;
    console.log("Got remote media stream");
    remoteStream = stream;
    remoteAudio.srcObject = remoteStream;
//    const audioTracks = remoteStream.getAudioTracks();
//    for (let i in audioTracks) {
//        remotePeerConnection.addTrack(audioTracks[i]);
//    };
    console.log("playing remote stream");
}

function handleSetSessionDescriptionError(error) {
    console.log('SetSessionDescriptionError: ' + error);
}

function setLocalDescriptionSuccess(peerConnection) {
// TODO
}
function setRemoteDescriptionSuccess(peerConnection) {
// TODO
}

function createdAnswer(description) {
    console.log("created answer start");
    remotePeerConnection.setLocalDescription(description)
    .then(() => {
        setLocalDescriptionSuccess(remotePeerConnection);
    }).catch(handleSetSessionDescriptionError);

}
offers_socket.onmessage = function(event) {
    console.log("got offer");
    localPeerConnection.setRemoteDescription(description)
    .then(() => {
        setRemoteDescriptionSuccess(localPeerConnection);
    }).catch(handleSetSessionDescriptionError);

    remotePeerConnection.createAnswer()
        .then(createdAnswer)
        .catch(handleSetSessionDescriptionError);
}
function createdOffer(description) {
    offers_socket.send(JSON.stringify(description));
    let description_sdp = `v=0
o=mozilla...THIS_IS_SDPARTA-75.0 5796167846678117617 0 IN IP4 0.0.0.0
s=-
t=0 0
a=fingerprint:sha-256 84:6C:94:4E:26:87:25:1A:C6:8C:34:96:61:48:64:DC:1E:94:85:3F:5C:49:5C:72:E0:16:D5:96:ED:98:BB:64
a=group:BUNDLE 0
a=ice-options:trickle
a=msid-semantic:WMS *
m=audio 9 UDP/TLS/RTP/SAVPF 109
c=IN IP4 0.0.0.0
a=sendrecv
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level
a=extmap:2/recvonly urn:ietf:params:rtp-hdrext:csrc-audio-level
a=extmap:3 urn:ietf:params:rtp-hdrext:sdes:mid
a=fmtp:101 0-15
a=ice-pwd:13904b94e36a21b94e6222c1ca550f82
a=ice-ufrag:bceaf510
a=mid:0
a=msid:{88071ff6-14e9-40ce-bb72-a19211cb6f2b} {a4847934-5757-4ce3-a6c2-16ad22937176}
a=rtcp-mux
a=rtpmap:109 opus/48000/2
a=fmtp:109 maxplaybackrate=48000;stereo=1;useinbandfec=1,maxaveragebitrate=32000
a=ptime:20
a=maxptime:20
a=rtpmap:9 G722/8000/1
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:101 telephone-event/8000/1
a=setup:actpass
a=ssrc:3982142391 cname:{4d4bab08-78ca-4a28-998c-2121e0315a34}
`;
    console.log("created offer start");
    localPeerConnection.setLocalDescription(description)
    .then(() => {
        setLocalDescriptionSuccess(localPeerConnection);
    }).catch(handleSetSessionDescriptionError);
    console.log("Local SDP:" + description.sdp);

    remotePeerConnection.setRemoteDescription(description)
    .then(() => {
        setRemoteDescriptionSuccess(remotePeerConnection);
    }).catch(handleSetSessionDescriptionError);
    console.log("Remote SDP:" + description.sdp);

}

// Local Peer Connection
const servers = null
let localPeerConnection = new RTCPeerConnection(servers)

// Remote Peer Connection
let remotePeerConnection = new RTCPeerConnection(servers)


// setup offer
const offerOptions = {
    offerToReceiveAudio: 1,
}



// start local stream
navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream).catch(handleLocalMediaStreamError);






// Gets the "other" peer connection.
function getOtherPeer(peerConnection) {
  return (peerConnection === localPeerConnection) ?
      remotePeerConnection : localPeerConnection;
}

// Gets the name of a certain peer connection.
function getPeerName(peerConnection) {
  return (peerConnection === localPeerConnection) ?
      'localPeerConnection' : 'remotePeerConnection';
}

