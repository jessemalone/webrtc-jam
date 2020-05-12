#!/usr/bin/env python3

import asyncio
import websockets
import json

offer_clients = set()
ice_clients = set()

async def handle_offer(offer):
    if offer_clients:
        await asyncio.wait([client.send(offer) for client in offer_clients])


async def handle_ice(ice):
    if offer_clients:
        await asyncio.wait([client.send(ice) for client in ice_clients])

async def dispatch(websocket, path):
   if (path == "/offer"):
       offer_clients.add(websocket)
       try:
           async for json_message in websocket:
               # TODO: handle parse error
                offer = json.loads(json_message);
                await handle_offer(json_message)
       finally:
           offer_clients.remove(websocket)
   if (path == "/ice"):
       ice_clients.add(websocket)
       try:
           async for json_message in websocket:
               # TODO: handle parse error
                ice = json.loads(json_message);
                await handle_ice(json_message)
       finally:
           ice_clients.remove(websocket)

start_server = websockets.serve(dispatch, "0.0.0.0", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
