function Message(type,data,sender_guid, receiver_guid) {
    this.type = type;
    this.data = data;
    this.sender_guid = sender_guid
    this.receiver_guid = receiver_guid;
}

export {Message}
