import asyncio
import unittest
import websockets
import uuid

from unittest.mock import patch
from unittest.mock import MagicMock

from lib.channel import Channel
from lib.client import Client
from lib.message import Message

class AsyncMock(MagicMock):
    async def __call__(self, *args, **kwargs):
        return super(AsyncMock, self).__call__(*args, **kwargs)

class ChannelTests(unittest.TestCase):
    def test_init(self):
        # It sets the channel name and assigned a uuid
        sample_name = "test-name"
        channel = Channel(sample_name)
        self.assertEqual(channel.name, sample_name)
        self.assertTrue(uuid.UUID(channel.id) != "")

    def test_add_client(self):
        # It adds the client and assigns a uuid address
        test_client = Client(websockets.protocol.WebSocketCommonProtocol())
        channel = Channel("test-channel")
        channel.add_client(test_client)
        self.assertTrue(len(channel.clients) == 1)

        client = channel.clients.pop()
        self.assertEqual(client, test_client)

    def test_remove_client(self):
        # It removes the client
        remaining_client = Client(websockets.protocol.WebSocketCommonProtocol(host="1"))
        removed_client = Client(websockets.protocol.WebSocketCommonProtocol(host="2"))
        channel = Channel("test-channel")
        channel.add_client(remaining_client)
        channel.add_client(removed_client)
        self.assertTrue(len(channel.clients) == 2)
        
        # It removes a client
        channel.remove_client(removed_client)
        self.assertTrue(len(channel.clients) == 1)

        # It removes the right client
        actual_remaining_client = channel.clients.pop()
        self.assertEqual(remaining_client, actual_remaining_client)


    @patch('websockets.protocol.WebSocketCommonProtocol', new_callable=AsyncMock)
    @patch('websockets.protocol.WebSocketCommonProtocol', new_callable=AsyncMock)
    @patch('websockets.protocol.WebSocketCommonProtocol', new_callable=AsyncMock)
    def test_broadcast(self, SenderMockWebSocket, Receiver1MockWebSocket, Receiver2MockWebSocket):
        # Set up some clients
        sender = Client(SenderMockWebSocket)
        receiver1 = Client(Receiver1MockWebSocket)
        receiver2 = Client(Receiver2MockWebSocket)
        channel = Channel("test_channel")
        channel.add_client(sender)
        channel.add_client(receiver1)
        channel.add_client(receiver2)
        self.assertTrue(len(channel.clients) == 3)

        # It sends a message to each client
        sample_message = Message(
                type = "announce",
                data= "data"
                )
        asyncio.get_event_loop().run_until_complete(
                channel.broadcast(sender, sample_message)
        )
        # It called send
        Receiver1MockWebSocket.send.assert_called()
        Receiver2MockWebSocket.send.assert_called()

        # It sent the right message
        sent_message = Message.from_json(Receiver1MockWebSocket.send.call_args[0][0])
        sent_data = sent_message.data
        sent_type = sent_message.type
        self.assertEqual(sent_data, sample_message.data)
        self.assertEqual(sent_type, sample_message.type)

        # It set the "sender_guid"
        sent_from = sent_message.sender_guid
        self.assertEqual(sent_from, sender.address)
        

    @patch('websockets.protocol.WebSocketCommonProtocol', new_callable=AsyncMock)
    @patch('websockets.protocol.WebSocketCommonProtocol', new_callable=AsyncMock)
    def test_send(self, SenderMockWebSocket, ReceiverMockWebSocket):
        # Set up some clients
        sender = Client(SenderMockWebSocket)
        receiver = Client(ReceiverMockWebSocket)
        channel = Channel("test_channel")
        channel.add_client(sender)
        channel.add_client(receiver)
        self.assertTrue(len(channel.clients) == 2)

        # It sends a message to receiver
        sample_message = Message(
                receiver_guid = receiver.address,
                type = "announce",
                data = "data"
                )
        asyncio.get_event_loop().run_until_complete(
                channel.send(sender, sample_message)
        )
        # It called send
        ReceiverMockWebSocket.send.assert_called()

        # It sent the right message
        sent_message = Message.from_json(ReceiverMockWebSocket.send.call_args[0][0])
        sent_data = sent_message.data
        sent_type = sent_message.type
        self.assertEqual(sent_data, sample_message.data)
        self.assertEqual(sent_type, sample_message.type)

        # It set the "sender_guid"
        sent_from = sent_message.sender_guid
        self.assertEqual(sent_from, sender.address)
