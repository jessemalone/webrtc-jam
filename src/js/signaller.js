'use strict'

import {Message} from './message'

function Signaller(websocket) {
    this.websocket = websocket;
    this.offerHandler = function(){};
    this.answerHandler = function(){};
    this.announceHandler = function(){};
    this.iceHandler = function(){};
    this.hangupHandler = function(){};
    this.websocket.onmessage = (event) => this.messageHandler(event);
}

Signaller.prototype.messageHandler = function(event) {
    let data = JSON.parse(event.data)
    let message = new Message(data.type, data.data, data.sender_guid, data.receiver_guid)
    switch (message.type) {
        case 'offer':
            this.offerHandler(message);
            break;
        case 'answer':
            this.answerHandler(message);
            break;
        case 'announce':
            this.announceHandler(message);
            break;
        case 'ice':
            this.iceHandler(message);
            break;
        case 'hangup':
            this.hangupHandler(message);
            break;
    }
}

Signaller.prototype.announce = function() {
    console.log("send announce!");
    let message = new Message("announce","announce","","");
    this.websocket.send(JSON.stringify(message));
}

Signaller.prototype.setHandler = function(type, handler) {
    switch(type) {
        case "offer":
            this.offerHandler = handler;
            break;
        case "answer":
            this.answerHandler = handler;
            break;
        case "announce":
            this.announceHandler = handler;
            break;
        case "ice":
            this.iceHandler = handler;
            break;
        case "hangup":
            this.hangupHandler = handler;
            break;
    }
}

Signaller.prototype.send = function(message) {
    this.websocket.send(JSON.stringify(message));
};


export {Signaller}
