import asyncio
import unittest
import json

from lib.dispatcher import Dispatcher
from lib.channel import Channel
from lib.client import Client
from lib.message import Message

class MockAsyncIterator:
    def __init__(self, iterable):
        self.iterable = iterable

    def __aiter__(self):
        return self

    async def __anext__(self):
        try:
            return next(self.iterable)
        except StopIteration:
            raise StopAsyncIteration

class DispatcherTests(unittest.TestCase):
    def setUp(self):
        self.target_channel = Channel("target_channel")
        self.target_channel.broadcast = unittest.mock.AsyncMock()
        self.target_channel.send = unittest.mock.AsyncMock()
        self.another_channel = Channel("another_channel")
        self.channels = {
                self.target_channel.id: self.target_channel, 
                self.another_channel.id: self.another_channel
                }
        self.sender_mock_socket = MockAsyncIterator(iter([]))
        self.sender = Client(self.sender_mock_socket)
        self.receiver_mock_socket = MockAsyncIterator(iter([]))
        self.receiver = Client(self.receiver_mock_socket)
        self.sample_message = Message(self.sender.address,self.receiver.address,self.target_channel.id,"")

    def test_init(self):
        expected_channels = {
            "channel1": Channel("channel1"),
            "channel2": Channel("channel2")
                }
        dispatcher = Dispatcher(expected_channels)
        self.assertEqual(dispatcher.channels, expected_channels)

    def test_create_channel(self):

        message = self.sample_message
        message.type = "create_channel"
        message.receiver_guid = ""
        message.data = {"name": "new_channel"}

        # Mock the webocket methods
        self.sender_mock_socket.send = unittest.mock.AsyncMock()

        dispatcher = Dispatcher({})
        self.mock_receive_message(message, dispatcher)

        # It adds a new channel
        found = False
        new_channel = ""
        for channel in dispatcher.channels.values():
            found = channel.name == "new_channel"
            if found:
                new_channel = channel
                break
        self.assertTrue(found)

        # It sends an 'ack' with the channel id
        self.sender_mock_socket.send.assert_called()
        sent_message = Message.from_json(self.sender_mock_socket.send.call_args_list[0][0][0])
        self.assertEqual(sent_message.type, "ack")
        self.assertEqual(sent_message.data["channel_id"], new_channel.id)

    def test_client_disconnect(self):
        message = self.sample_message
        message.type = "ignored"
        message.channel_id = self.target_channel.id

        dispatcher = Dispatcher(self.channels)
        self.mock_receive_message(message, dispatcher)

        # It broadcasts a hangup
        self.target_channel.broadcast.assert_called()
        sent_message = self.target_channel.broadcast.call_args_list[0][0][1]
        self.assertEqual(sent_message.type, "hangup")

        # It removes the client from the channel
        self.assertEqual(len(self.target_channel.clients), 0)

    def test_message_with_missing_channel(self):
        # When channel_id is missing

        message = self.sample_message
        message.type = "anything_but_create_channel"
        message.channel_id = "non_existent"
        message.receiver_guid = ""

        # Mock the webocket methods
        self.sender_mock_socket.close = unittest.mock.AsyncMock()
        self.sender_mock_socket.send = unittest.mock.AsyncMock()

        # Receive the test message
        dispatcher = Dispatcher(self.channels)
        self.mock_receive_message(message, dispatcher)

        # It sends an error to the sender
        self.sender_mock_socket.send.assert_called()
        sent_message = Message.from_json(self.sender_mock_socket.send.call_args_list[0][0][0])
        self.assertEqual(sent_message.type, "error")

        # It disconnects
        self.sender_mock_socket.close.assert_called()

    def test_announce_message(self):
        # When an "announce" is received

        message = self.sample_message
        message.type = "announce"
        message.receiver_guid = ""

        # It broadcasts it to the channel
        self.it_broadcasts(message)

        # It adds the sender to the channel
        matching_clients = list(client for client in list(self.target_channel.clients) if client.websocket == self.sender.websocket)
        self.assertEqual(len(matching_clients), 1)

    def test_name_message(self):
        message = self.sample_message
        message.type = "name"
        message.receiver_guid = ""

        # It broadcasts it to the channel
        self.it_broadcasts(message)


    def test_offer_message(self):
        message = self.sample_message
        message.type = "offer"
        self.it_sends(message)

    def test_answer_message(self):
        message = self.sample_message
        message.type = "answer"
        self.it_sends(message)

    def test_ice_message(self):
        message = self.sample_message
        message.type = "ice"
        self.it_sends(message)

    def it_broadcasts(self, message):
        self.target_channel.remove_client = unittest.mock.Mock()
        self.sender_mock_socket.iterable = iter([message.to_json()])

        dispatcher = Dispatcher(self.channels)

        asyncio.get_event_loop().run_until_complete(
                dispatcher.handle_connection(self.sender_mock_socket, "/")
        )

        # It broadcasts it to the channel
        self.target_channel.broadcast.assert_called()
        broadcast_args = self.target_channel.broadcast.call_args_list[0]
        self.assertEqual(self.sender.websocket, broadcast_args[0][0].websocket)
        self.assertEqual(vars(message), vars(broadcast_args[0][1]))

    def it_sends(self, message):
        self.target_channel.remove_client = unittest.mock.Mock()
        self.sender_mock_socket.iterable = iter([message.to_json()])

        self.target_channel.add_client(self.sender)
        dispatcher = Dispatcher(self.channels)

        asyncio.get_event_loop().run_until_complete(
                dispatcher.handle_connection(self.sender_mock_socket, "/")
        )

        # It sends the message
        self.target_channel.send.assert_called()
        send_args = self.target_channel.send.call_args_list[0]
        self.assertEqual(self.sender.websocket, send_args[0][0].websocket)
        self.assertEqual(vars(message), vars(send_args[0][1]))

    def mock_receive_message(self, message, dispatcher):
        self.target_channel.remove_client = unittest.mock.Mock()
        self.sender_mock_socket.iterable = iter([message.to_json()])
        
        asyncio.get_event_loop().run_until_complete(
                dispatcher.handle_connection(self.sender_mock_socket, "/")
        )
