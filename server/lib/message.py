import json

class Message:

    def __init__(self, 
                 obj_dict = {
                     "from_client": "",
                     "to_client": "",
                     "message_type": "",
                     "data": None}
                 ):
        for key in obj_dict:
            setattr(self, key, obj_dict[key])

    def to_json(self):
        return json.dumps(self.__dict__)

    @staticmethod
    def from_json(json_string):
        obj = json.loads(json_string)
        return Message(obj)


