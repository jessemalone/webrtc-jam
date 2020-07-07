import uuid
import json
from lib.client import Client

class MessageHandler:

    def __init__(self):
        self.clients = set()
    
    def add_client(self, client):
        self.clients.add(client)

    def remove_client(self, client):
        self.clients.remove(client)

    async def broadcast(self, sender,  message):
        message.sender_guid = sender.address
        for client in self.clients:
            if (client != sender):
                await client.websocket.send(message.to_json())

    async def send(self, sender,  message):
        message.sender_guid = sender.address
        recipient = next(c for c in self.clients if c.address == message.receiver_guid)
        await recipient.websocket.send(message.to_json())
