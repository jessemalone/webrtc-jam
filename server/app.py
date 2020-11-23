#!/usr/bin/env python3

import asyncio
import websockets

from lib.dispatcher import Dispatcher

dispatcher = Dispatcher()


print("starting signalling server", flush=True)
start_server = websockets.serve(dispatcher.handle_connection, "0.0.0.0", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
