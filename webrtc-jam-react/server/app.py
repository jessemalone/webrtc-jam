#!/usr/bin/env python3

import asyncio
import websockets
import json

from lib.message_handler import MessageHandler
from lib.client import Client
from lib.message import Message

message_handler = MessageHandler()

async def dispatch(websocket, path):
    client = Client(websocket)
    print("New client: " + client.address, flush=True)
    try:
        async for json_message in websocket:
            message = Message.from_json(json_message)
            if (message.type in ["announce"]):
                message_handler.add_client(client)
                await message_handler.broadcast(client, message)
            elif (message.type in ["offer","answer","ice"]):
                await message_handler.send(client, message)
            elif (message.type in ["name"]):
                await message_handler.broadcast(client, message)

    finally:
        message_handler.remove_client(client)

        # broadcast the departure
        message = Message(type = "hangup")
        await message_handler.broadcast(client, message)
        print("Client " + client.address + " left", flush=True)

print("starting signalling server", flush=True)
start_server = websockets.serve(dispatch, "0.0.0.0", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
