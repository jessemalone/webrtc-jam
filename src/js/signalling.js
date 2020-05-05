'use strict'

function RTCSignaller(websocketHost) {
    this.offersSocket = new WebSocket("ws://" + websocketHost + "/ws/offer");
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

export { RTCSignaller as default }
