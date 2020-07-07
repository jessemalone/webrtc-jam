import json

class Message:

    def __init__(self, 
                     sender_guid = "",
                     receiver_guid =  "",
                     type = "",
                     data = None
                 ):
        self.sender_guid = sender_guid
        self.receiver_guid = receiver_guid
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
                obj["type"],
                obj["data"]
                )


