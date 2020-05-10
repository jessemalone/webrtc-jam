'use strict'

function RTCSignaller(websocketHost) {
    this.offersSocket = new WebSocket("wss://" + websocketHost + "/ws/offer");
}

RTCSignaller.prototype.sendOffer = function(offer) {
    console.log("send offer");
    this.offersSocket.send(JSON.stringify(offer));
}

RTCSignaller.prototype.onOffer = function(callback) {
    console.log("setting offer callback");
    this.offersSocket.onmessage = function(event) {
        callback(JSON.parse(event.data));
    }
}

function ICESignaller(websocketHost) {
    this.iceSocket = new WebSocket("wss://" + websocketHost + "/ws/ice");
}

ICESignaller.prototype.sendIce = function(event) {
    console.log("send ice");
    console.log(this);
    this.iceSocket.send(JSON.stringify(event.candidate));
}

ICESignaller.prototype.onIce = function(callback) {
    console.log("setting ice callback");
    this.iceSocket.onmessage = function(event) {
        callback(JSON.parse(event.data));
    }
}

export {RTCSignaller, ICESignaller}
