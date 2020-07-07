import unittest
import websockets
import uuid

from lib.client import Client

class ClientTests(unittest.TestCase):
    def test_init(self):
        # It sets the websocket and address
        sample_websocket = websockets.protocol.WebSocketCommonProtocol(host="1")
        client = Client(sample_websocket)
        self.assertEqual(client.websocket, sample_websocket)
        self.assertTrue(uuid.UUID(client.address) != "")
