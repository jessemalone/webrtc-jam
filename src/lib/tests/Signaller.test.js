import {Signaller} from '../Signaller'
import {Message} from '../Message'

let signaller;
let mockSocket;

beforeEach(() => {
    mockSocket = WebSocket;
    mockSocket.send = jest.fn((obj) => {});
    signaller = new Signaller(mockSocket);
});

test('Signaller.announce sends a message with type "announce"', () => {
    let expected_message = JSON.stringify(new Message("announce","announce","","","expected_channel"));

    signaller.announce("expected_channel");
    expect(mockSocket.send.mock.calls.length).toBe(1);
    expect(mockSocket.send.mock.calls[0][0]).toBe(expected_message);
});

test('Signaller.send sends a message', () => {
    let expected_offer = {"data":"offer"};
    let expected_sender = "sender";
    let expected_receiver = "receiver";

    // Offer
    let sample_message = new Message("offer",expected_offer,expected_sender, expected_receiver);

    // It sends a message
    signaller.send(sample_message);
    expect(mockSocket.send.mock.calls.length).toBe(1);
    expect(mockSocket.send.mock.calls[0][0]).toBe(JSON.stringify(sample_message));
    jest.clearAllMocks();
});

test('Signaller.addHandler calls the right handler', () => {
    let mockHandler = jest.fn(() => {});
    let data = {"data":"some_data"};
    let expected_sender = "sender";
    let expected_receiver = "receiver";

    let offer_message = new Message("offer", data, expected_sender, expected_receiver);
    let answer_message = new Message("answer", data, expected_sender, expected_receiver);
    let announce_message = new Message("announce", data, expected_sender, expected_receiver);
    let ice_message = new Message("ice", data, expected_sender, expected_receiver);
    let hangup_message = new Message("hangup", data, expected_sender, expected_receiver);
    let name_message = new Message("name", data, expected_sender, expected_receiver);
    let ack_message = new Message("ack", data, expected_sender, expected_receiver);

    // It calls the right handler for the message type
    const sample_messages = [ack_message, name_message, hangup_message, offer_message, ice_message, answer_message, announce_message]
    for (const i in sample_messages) {
        jest.clearAllMocks();
        var sample_message = sample_messages[i]
        var type = sample_message.type;

        signaller.addHandler(type, mockHandler);
        signaller.addHandler(type, mockHandler);
        mockSocket.onmessage({"data": JSON.stringify(sample_message)})
        expect(mockHandler.mock.calls.length).toBe(2);
        expect(mockHandler.mock.calls[0][0]).toEqual(sample_message);
    }
    jest.clearAllMocks();
});
