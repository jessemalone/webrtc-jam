import {Signaller} from '../signaller'
import {Message} from '../message'

let signaller;
let mockSocket;

beforeEach(() => {
    mockSocket = WebSocket;
    mockSocket.send = jest.fn((obj) => {});
    signaller = new Signaller(mockSocket);
});

test('Signaller.announce sends a message with type "announce"', () => {
    let expected_message = JSON.stringify(new Message("announce","announce",""));

    signaller.announce();
    expect(mockSocket.send.mock.calls.length).toBe(1);
    expect(mockSocket.send.mock.calls[0][0]).toBe(expected_message);
});

test('Signaller.sendOffer sends a message with type "offer" with expected data', () => {
    let expected_offer = {"data":"some_data"};
    let expected_address = "some-address";
    let expected_message = JSON.stringify(new Message("offer",JSON.stringify(expected_offer),expected_address));

    signaller.sendOffer(expected_offer, expected_address);
    expect(mockSocket.send.mock.calls.length).toBe(1);
    expect(mockSocket.send.mock.calls[0][0]).toBe(expected_message);
});

test('Signaller.setOfferHandler calls handler on receiving only a message with type "offer"', () => {
    let mockHandler = jest.fn(() => {});
    let offer = {"data":"some_data"};
    let address = "some-address";
    let offer_message = new Message("offer",offer,address);
    let answer_message = new Message("answer",offer,address);
    let announce_message = new Message("announce",offer,address);
    let ice_message = new Message("ice",offer,address);

    // It calls handler on offer 
    signaller.setOfferHandler(mockHandler);
    mockSocket.onmessage({"data": JSON.stringify(offer_message)})
    expect(mockHandler.mock.calls.length).toBe(1);
    expect(mockHandler.mock.calls[0][0]).toEqual(offer_message);

    // Doesn't call handler for other types
    jest.clearAllMocks();
    for (const sample_message in [ice_message, answer_message, announce_message]) {
        mockSocket.onmessage({"data": sample_message})
        expect(mockHandler.mock.calls.length).toBe(0);
    }
});

test('Signaller.sendAnswer sends a message with type "answer" with expected data', () => {
    let expected_answer = {"data":"some_data"};
    let expected_address = "some-address";
    let expected_message = JSON.stringify(new Message("answer",JSON.stringify(expected_answer),expected_address));

    signaller.sendAnswer(expected_answer, expected_address);
    expect(mockSocket.send.mock.calls.length).toBe(1);
    expect(mockSocket.send.mock.calls[0][0]).toBe(expected_message);
});

test('Signaller.setAnswerHandler calls handler on receiving only a message with type "answer"', () => {
    let mockHandler = jest.fn(() => {});
    let offer = {"data":"some_data"};
    let address = "some-address";
    let offer_message = new Message("offer",offer,address);
    let answer_message = new Message("answer",offer,address);
    let announce_message = new Message("announce",offer,address);
    let ice_message = new Message("ice",offer,address);

    // It calls handler on answer
    signaller.setAnswerHandler(mockHandler);
    mockSocket.onmessage({"data": JSON.stringify(answer_message)})
    expect(mockHandler.mock.calls.length).toBe(1);
    expect(mockHandler.mock.calls[0][0]).toEqual(answer_message);

    // Doesn't call handler for other types
    jest.clearAllMocks();
    for (const sample_message in [ice_message, offer_message, announce_message]) {
        mockSocket.onmessage({"data": sample_message})
        expect(mockHandler.mock.calls.length).toBe(0);
    }
});

test('Signaller.sendIce sends a message with type "ice" with expected data', () => {
    let expected_candidate = "some_ice_candidate";
    let expected_address = "some-address";
    let expected_message = JSON.stringify(new Message("ice",JSON.stringify(expected_candidate),expected_address));

    signaller.sendIce(expected_candidate, expected_address);
    expect(mockSocket.send.mock.calls.length).toBe(1);
    expect(mockSocket.send.mock.calls[0][0]).toBe(expected_message);

});

test('Signaller.setIceHandler calls handler on receiving only a message with type "ice"', () => {
    let mockHandler = jest.fn(() => {});
    let iceCandidate = "some-ice-candidate";
    let address = "some-address";
    let offer_message = new Message("offer","",address);
    let answer_message = new Message("answer","",address);
    let announce_message = new Message("announce","",address);
    let ice_message = new Message("ice",iceCandidate,address);

    // It calls handler on answer
    signaller.setIceHandler(mockHandler);
    mockSocket.onmessage({"data": JSON.stringify(ice_message)})
    expect(mockHandler.mock.calls.length).toBe(1);
    expect(mockHandler.mock.calls[0][0]).toEqual(ice_message);

    // Doesn't call handler for other types
    jest.clearAllMocks();
    for (const sample_message in [answer_message, offer_message, announce_message]) {
        mockSocket.onmessage({"data": sample_message})
        expect(mockHandler.mock.calls.length).toBe(0);
    }
});
