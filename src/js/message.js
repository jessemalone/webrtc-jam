'use strict'

function Message(type,data,recipient_guid) {
    this.type = type;
    this.data = data;
    this.recipient_guid = recipient_guid;
}

export {Message}
