#!/usr/bin/env python3

import asyncio
import websockets
import json

from lib.message_handler import MessageHandler
from lib.client import Client

message_handler = MessageHandler()

async def dispatch(websocket, path):
    try:
        client = Client(websocket)
        async for json_message in websocket:
            message = message.from_json(json_message)
            if (message.type == "announce"):
                message_handler.add_client(client)
                message_handler.broadcast(client, message)
            elif (message.type in ["offer","answer","ice"]):
                message_handler.send(client, message)
    finally:
        message_handler.remove_client(client)

start_server = websockets.serve(dispatch, "0.0.0.0", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
