import uuid
import json
from lib.client import Client

class Channel:

    def __init__(self, name):
        self.clients = set()
        self.name = name
        self.id = uuid.uuid4().hex
    
    def add_client(self, client):
        self.clients.add(client)

    def remove_client(self, client):
        self.clients.remove(client)

    async def broadcast(self, sender,  message):
        print("DEBUG: broadcasting " + message.type)
        message.sender_guid = sender.address
        message.channel_id = self.id
        for client in self.clients:
            if (client != sender):
                await client.websocket.send(message.to_json())
        print("DEBUG: done broadcasting " + message.type)

    async def send(self, sender,  message):
        message.sender_guid = sender.address
        recipient = next(c for c in self.clients if c.address == message.receiver_guid)
        await recipient.websocket.send(message.to_json())
