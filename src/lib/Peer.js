function Peer(id,connection, audioTransport) {
    this.id = id;
    this.connection = connection;
    this.audioTransport = audioTransport;
}

export {Peer}
