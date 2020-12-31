import {Message} from './Message'

function Signaller(websocket) {
    this.websocket = websocket;
    this.offerHandlers = [];
    this.answerHandlers = [];
    this.announceHandlers = [];
    this.iceHandlers = [];
    this.hangupHandlers = [];
    this.nameHandlers = [];
    this.ackHandlers = [];
    this.websocket.onmessage = (event) => this.messageHandler(event);
}

Signaller.prototype.messageHandler = function(event) {
    let data = JSON.parse(event.data)
    let message = new Message(data.type, data.data, data.sender_guid, data.receiver_guid,data.channel_id)
    switch (message.type) {
        case 'offer':
            this.offerHandlers.forEach((handler) => {
                handler(message);
            });
            break;
        case 'answer':
            this.answerHandlers.forEach((handler) => {
                handler(message);
            });
            break;
        case 'announce':
            this.announceHandlers.forEach((handler) => {
                handler(message);
            });
            break;
        case 'ice':
            this.iceHandlers.forEach((handler) => {
                handler(message);
            });
            break;
        case 'hangup':
            this.hangupHandlers.forEach((handler) => {
                handler(message);
            });
            break;
        case 'name':
            this.nameHandlers.forEach((handler) => {
                handler(message);
            });
            break;
        case 'ack':
            this.ackHandlers.forEach((handler) => {
                handler(message);
            });
            break;
        default:
    }
}

Signaller.prototype.announce = function(channelId) {
    console.log("send announce!");
    let message = new Message("announce","announce","","",channelId);
    this.websocket.send(JSON.stringify(message));
}

Signaller.prototype.addHandler = function(type, handler) {
    switch(type) {
        case "offer":
            this.offerHandlers.push(handler);
            break;
        case "answer":
            this.answerHandlers.push(handler);
            break;
        case "announce":
            this.announceHandlers.push(handler);
            break;
        case "ice":
            this.iceHandlers.push(handler);
            break;
        case "hangup":
            this.hangupHandlers.push(handler);
            break;
        case "name":
            this.nameHandlers.push(handler);
            break;
        case "ack":
            this.ackHandlers.push(handler);
            break;
        default:
    }
}

Signaller.prototype.send = function(message) {
    this.websocket.send(JSON.stringify(message));
};


export {Signaller}
