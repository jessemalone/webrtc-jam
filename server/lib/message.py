import json

class Message:

    def __init__(self, 
                     sender_guid = "",
                     receiver_guid =  "",
                     channel_id = "",
                     type = "",
                     data = None
                 ):
        self.sender_guid = sender_guid
        self.receiver_guid = receiver_guid
        self.channel_id = channel_id
        self.type = type
        self.data = data

    def to_json(self):
        return json.dumps(self.__dict__)

    @staticmethod
    def from_json(json_string):
        obj = json.loads(json_string)
        return Message(
                obj["sender_guid"],
                obj["receiver_guid"],
                obj["channel_id"],
                obj["type"],
                obj["data"]
                )


