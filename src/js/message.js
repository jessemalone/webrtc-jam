'use strict'

function Message(type,data,senderGuid, receiverGuid) {
    this.type = type;
    this.data = data;
    this.senderGuid = senderGuid
    this.receiverGuid = receiverGuid;
}

export {Message}
