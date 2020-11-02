import asyncio

from lib.client import Client
from lib.channel import Channel
from lib.message import Message

class Dispatcher:

    def __init__(self, channels: dict = {}):
        self.channels = channels

    async def handle_connection(self, websocket: iter, path: str):
        client = Client(websocket)
        print("New client: " + client.address, flush=True)
        channel = None
        try:
            async for json_message in websocket:
                message = Message.from_json(json_message)
                if message.type == "create_channel":
                    new_channel = Channel(message.data["name"])
                    new_channel.clients.add(client)
                    self.channels[new_channel.id] = new_channel
                    ack = Message(type="ack", data={"channel_id": new_channel.id})
                    await websocket.send(ack.to_json())
                    continue

                channel_id = message.channel_id
                if channel_id in self.channels.keys():
                    channel = self.channels[channel_id]
                else:
                    message = Message(type = "error")
                    await websocket.send(message.to_json())
                    await websocket.close()
                    break

                if (message.type in ["announce"]):
                    channel.add_client(client)
                    await channel.broadcast(client, message)
                elif (message.type in ["offer","answer","ice"]):
                    await channel.send(client, message)
                elif (message.type in ["name"]):
                    await channel.broadcast(client, message)

        finally:
            if channel:
                channel.remove_client(client)

                # broadcast the departure
                message = Message(type = "hangup")
                await channel.broadcast(client, message)
            print("Client " + client.address + " left", flush=True)
