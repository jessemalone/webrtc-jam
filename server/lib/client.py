import uuid

class Client:

    def __init__(self, websocket):
        self.address = uuid.uuid4().hex
        self.websocket = websocket
