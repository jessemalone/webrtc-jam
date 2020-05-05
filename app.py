#!/usr/bin/env python3

import asyncio
import websockets
import json

offer_clients = set()

async def register_offer_client(client):
    offer_clients.add(client)

async def unregister_offer_client(client):
    offer_clients.remove(client)

async def handle_offer(offer):
    # print(offer)
    # print(offer)
    if offer_clients:
        await asyncio.wait([client.send(offer) for client in offer_clients])

async def dispatch(websocket, path):
   if (path == "/offer"):
       await register_offer_client(websocket)
       try:
           async for json_message in websocket:
               # TODO: handle parse error
                offer = json.loads(json_message);
                await handle_offer(json_message)
       finally:
           await unregister_offer_client(websocket)
    

start_server = websockets.serve(dispatch, "0.0.0.0", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
