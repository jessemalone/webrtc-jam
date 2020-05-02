#!/usr/bin/env python3

import asyncio
import websockets
import json

async def handle_offer(sdp):
    print(sdp)

async def dispatch(websocket, path):
   if (path == "/offer"):
       async for json_message in websocket:
            # TODO: handle parse error
            offer = json.loads(json_message);
            await handle_offer(offer)

    

start_server = websockets.serve(dispatch, "localhost", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
