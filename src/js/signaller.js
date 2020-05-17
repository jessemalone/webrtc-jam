'use strict'

import {Message} from './message'

function Signaller(websocket) {
    this.websocket = websocket;
    this.offerHandler = function(){};
    this.answerHandler = function(){};
    this.announceHandler = function(){};
    this.iceHandler = function(){};
    this.websocket.onmessage = (event) => this.messageHandler(event);
}

// TODO: Consolodate send*() into send(type, messaga)
// TODO: Consolodate set*Handler() into setHandler(type, handler)

Signaller.prototype.messageHandler = function(event) {
    let data = JSON.parse(event.data)
    let message = new Message(data.type, data.data, data.recipient_guid)
    switch (message.type) {
        case 'offer':
            this.offerHandler(message);
            break;
        case 'answer':
            this.answerHandler(message);
            break;
        case 'ice':
            this.iceHandler(message);
    }
}

Signaller.prototype.announce = function() {
    let message = new Message("announce","announce","");
    this.websocket.send(JSON.stringify(message));
}

Signaller.prototype.sendOffer = function(offer, recipient_guid) {
    let message = new Message("offer",JSON.stringify(offer),recipient_guid);
    this.websocket.send(JSON.stringify(message));
}

Signaller.prototype.setOfferHandler = function(handler) {
    this.offerHandler = handler;
}

Signaller.prototype.sendAnswer = function(answer, recipient_guid) {
    let message = new Message("answer",JSON.stringify(answer),recipient_guid);
    this.websocket.send(JSON.stringify(message));
}

Signaller.prototype.setAnswerHandler = function(handler) {
    this.answerHandler = handler;
}

Signaller.prototype.sendIce = function(candidate, recipient_guid) {
    let message = new Message("ice",JSON.stringify(candidate),recipient_guid);
    this.websocket.send(JSON.stringify(message));
}

Signaller.prototype.setIceHandler = function(handler) {
    this.iceHandler = handler;
}


export {Signaller}
