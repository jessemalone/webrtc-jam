import asyncio
import unittest
import websockets
import uuid

from unittest.mock import patch
from unittest.mock import MagicMock

from lib.message_handler import MessageHandler
from lib.client import Client
from lib.message import Message

class AsyncMock(MagicMock):
    async def __call__(self, *args, **kwargs):
        return super(AsyncMock, self).__call__(*args, **kwargs)

class MessageHandlerTests(unittest.TestCase):
    def test_add_client(self):
        # It adds the client and assigns a uuid address
        test_client = Client(websockets.protocol.WebSocketCommonProtocol())
        message_handler = MessageHandler()
        message_handler.add_client(test_client)
        self.assertTrue(len(message_handler.clients) == 1)

        client = message_handler.clients.pop()
        self.assertEqual(client, test_client)

    def test_remove_client(self):
        # It removes the client
        remaining_client = Client(websockets.protocol.WebSocketCommonProtocol(host="1"))
        removed_client = Client(websockets.protocol.WebSocketCommonProtocol(host="2"))
        message_handler = MessageHandler()
        message_handler.add_client(remaining_client)
        message_handler.add_client(removed_client)
        self.assertTrue(len(message_handler.clients) == 2)
        
        # It removes a client
        message_handler.remove_client(removed_client)
        self.assertTrue(len(message_handler.clients) == 1)

        # It removes the right client
        actual_remaining_client = message_handler.clients.pop()
        self.assertEqual(remaining_client, actual_remaining_client)


    @patch('websockets.protocol.WebSocketCommonProtocol', new_callable=AsyncMock)
    @patch('websockets.protocol.WebSocketCommonProtocol', new_callable=AsyncMock)
    @patch('websockets.protocol.WebSocketCommonProtocol', new_callable=AsyncMock)
    def test_broadcast(self, SenderMockWebSocket, Receiver1MockWebSocket, Receiver2MockWebSocket):
        # Set up some clients
        sender = Client(SenderMockWebSocket)
        receiver1 = Client(Receiver1MockWebSocket)
        receiver2 = Client(Receiver2MockWebSocket)
        message_handler = MessageHandler()
        message_handler.add_client(sender)
        message_handler.add_client(receiver1)
        message_handler.add_client(receiver2)
        self.assertTrue(len(message_handler.clients) == 3)

        # It sends a message to each client
        sample_message = Message({
                "type": "announce",
                "data": "data"
                })
        asyncio.get_event_loop().run_until_complete(
                message_handler.broadcast(sender, sample_message)
        )
        # It called send
        Receiver1MockWebSocket.send.assert_called()
        Receiver2MockWebSocket.send.assert_called()

        # It sent the right message
        sent_data = Receiver1MockWebSocket.send.call_args[0][0].data
        sent_type = Receiver1MockWebSocket.send.call_args[0][0].type
        self.assertEqual(sent_data, sample_message.data)
        self.assertEqual(sent_type, sample_message.type)

        # It set the "from_client"
        sent_from = Receiver1MockWebSocket.send.call_args[0][0].from_client
        self.assertEqual(sent_from, sender.address)
        

    @patch('websockets.protocol.WebSocketCommonProtocol', new_callable=AsyncMock)
    @patch('websockets.protocol.WebSocketCommonProtocol', new_callable=AsyncMock)
    def test_send(self, SenderMockWebSocket, ReceiverMockWebSocket):
        # Set up some clients
        sender = Client(SenderMockWebSocket)
        receiver = Client(ReceiverMockWebSocket)
        message_handler = MessageHandler()
        message_handler.add_client(sender)
        message_handler.add_client(receiver)
        self.assertTrue(len(message_handler.clients) == 2)

        # It sends a message to receiver
        sample_message = Message({
                "to_client": receiver.address,
                "type": "announce",
                "data": "data"
                })
        asyncio.get_event_loop().run_until_complete(
                message_handler.send(sender, sample_message)
        )
        # It called send
        ReceiverMockWebSocket.send.assert_called()

        # It sent the right message
        sent_data = ReceiverMockWebSocket.send.call_args[0][0].data
        sent_type = ReceiverMockWebSocket.send.call_args[0][0].type
        self.assertEqual(sent_data, sample_message.data)
        self.assertEqual(sent_type, sample_message.type)

        # It set the "from_client"
        sent_from = ReceiverMockWebSocket.send.call_args[0][0].from_client
        self.assertEqual(sent_from, sender.address)
