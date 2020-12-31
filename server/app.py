#!/usr/bin/env python3

import asyncio
import websockets
import threading

from flask import Flask, escape, request, jsonify
from flask_cors import CORS
from gevent.pywsgi import WSGIServer

from lib.dispatcher import Dispatcher

dispatcher = Dispatcher()
app = Flask(__name__)
cors = CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000/*"}})

@app.route('/api/channel/<id>')
def channel(id):
    global dispatcher
    channel = dispatcher.channels[id]
    return jsonify({"channel_name": channel.name, "channel_id": channel.id})



def run_websocket():
    global dispatcher
    print("starting signalling server", flush=True)
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    start_server = websockets.serve(dispatcher.handle_connection, "0.0.0.0", 8765)
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()

threading.Thread(target=run_websocket).start()

if __name__ == "__main__":
    http_server = WSGIServer(('',5000), app)
    http_server.serve_forever()
