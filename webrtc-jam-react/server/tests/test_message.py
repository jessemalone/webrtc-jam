import unittest
import json

from lib.message import Message

sample_message = {
            "sender_guid": "client2",
            "receiver_guid": "client1",
            "type": "type",
            "data": "somedata"
        }
class MessageTests(unittest.TestCase):
    def test_from_json(self):
        message_json = json.dumps(sample_message)
        message = Message.from_json(message_json)
        self.assertEqual(message.__dict__,sample_message)
    def test_to_json(self):
        message = Message(
                sample_message["sender_guid"],
                sample_message["receiver_guid"],
                sample_message["type"],
                sample_message["data"]
                )
        desired_json = json.dumps(sample_message)
        self.assertEqual(message.to_json(), desired_json)

