function Message(type,data,sender_guid, receiver_guid,channel_id) {
    this.type = type;
    this.data = data;
    this.sender_guid = sender_guid
    this.receiver_guid = receiver_guid;
    this.channel_id = channel_id;
}

export {Message}
