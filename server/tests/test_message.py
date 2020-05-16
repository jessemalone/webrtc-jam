import unittest
import json

from lib.message import Message

sample_message = {
            "to_client": "client1",
            "from_client": "client2",
            "message_type": "type",
            "data": "somedata"
        }
class MessageTests(unittest.TestCase):
    def test_from_json(self):
        message_json = json.dumps(sample_message)
        message = Message.from_json(message_json)
        self.assertEqual(message.__dict__,sample_message)
    def test_to_json(self):
        message = Message(sample_message)
        desired_json = json.dumps(sample_message)
        self.assertEqual(message.to_json(), desired_json)

