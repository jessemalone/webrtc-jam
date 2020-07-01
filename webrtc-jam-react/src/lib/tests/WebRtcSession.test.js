import {Signaller} from '../Signaller'
import {Message} from '../Message'
import {WebRtcSession} from '../WebRtcSession'
import {Peer} from '../Peer'
import {SdpParams} from '../SdpParams'

let peerConnections;
let mockPeerConnection;
let mockSignaller;
let mockStream;
let options = {};

beforeEach(() => {
    mockPeerConnection = {};
    mockSignaller = {
        send: jest.fn((obj) => {}),
        setHandler: jest.fn((type,handler) => {})
    };
    mockPeerConnection.setRemoteDescription = jest.fn((obj) => {});

    peerConnections = [
        new Peer('sender', mockPeerConnection),
        new Peer('another', {})
    ];
});

describe('new WebRtcSession', () => {
    test('It sets message handlers on the signaller', () => {
        let webRtcSession = new WebRtcSession(mockStream, mockSignaller, options, new SdpParams());

        expect(mockSignaller.setHandler.mock.calls.length).toBe(5);
        expect(mockSignaller.setHandler.mock.calls).toEqual(expect.arrayContaining(
            [
                ["answer", webRtcSession.handleAnswer],
                ["offer", webRtcSession.handleOffer],
                ["ice", webRtcSession.handleIceCandidate],
                ["announce", webRtcSession.handleAnnounce],
                ["hangup", webRtcSession.handleHangup]
            ]
        ));
    });
});

describe('WebRtcSession.answerHandler', () => {
    let webRtcSession;
    let message;
    let expected_data;
    beforeEach(() => {
        webRtcSession = new WebRtcSession(mockStream, mockSignaller, options, new SdpParams());
        webRtcSession.peerConnections = peerConnections;
        expected_data = 'sdp';
        message = new Message('answer',expected_data,'sender','receiver');
    });
    test('It sets the remote description on the right peer connection', () => {
        webRtcSession.handleAnswer(message);
        expect(mockPeerConnection.setRemoteDescription.mock.calls.length).toBe(1);
    });
    test('It sets the addstream handler on the peer connection', () => {
        let expected_event = {peerId: 'sender', stream: 'stream'};
        let mockStreamHandler = jest.fn((obj) => {});

        webRtcSession.onaddstream = mockStreamHandler;
        webRtcSession.handleAnswer(message);

        // It sets the addstream handler
        mockPeerConnection.onaddstream({stream: "stream"});
        expect(mockStreamHandler.mock.calls.length).toBe(1);
        expect(mockStreamHandler.mock.calls[0][0]).toMatchObject(expected_event);
    });
});

describe('WebRtcSession.offerHandler', () => {
    let webRtcSession;
    let message;
    let expected_data;
    let mockAnswerPromise;
    beforeEach(() => {
        webRtcSession = new WebRtcSession(mockStream, mockSignaller, options, new SdpParams());
        webRtcSession.peerConnections = peerConnections;
        expected_data = 'sdp';
        message = new Message('offer',expected_data,'sender','receiver');

        // Set up createPeer to return a mock peerConnections
        // with a mock implementation of addStream
        mockAnswerPromise = Promise.resolve('answer');
        mockPeerConnection = {
            addStream: jest.fn((obj) => {}),
            setRemoteDescription: jest.fn((obj) => {}),
            setLocalDescription: jest.fn((obj) => {}),
            createAnswer: jest.fn((obj) => {return mockAnswerPromise})
        }
        webRtcSession.createPeer = function(handler) {
            return mockPeerConnection;
        }
    });

    test('It adds the peer connection to the webrtc session', () => {
        webRtcSession.handleOffer(message);
        expect(peerConnections.length).toBe(3);
    });

    test('It sets the remote description on the right peer connection', () => {
        webRtcSession.handleOffer(message);
        expect(mockPeerConnection.setRemoteDescription.mock.calls.length).toBe(1);
        expect(mockPeerConnection.setRemoteDescription.mock.calls[0][0]).toBe(expected_data);
    });

    test('It sets the local description on the right peer connection', () => {
        webRtcSession.handleOffer(message);
        
        let checkPromise = function() {
            expect(mockPeerConnection.setLocalDescription.mock.calls.length).toBe(1);
            expect(mockPeerConnection.setLocalDescription.mock.calls[0][0]).toBe("answer");
        };
        return mockAnswerPromise.finally(checkPromise);
    });

    test('It sends an answer', () => {
        webRtcSession.handleOffer(message);
        
        let expected_message = new Message("answer","answer","", message.sender_guid);
        let checkPromise = function() {
            expect(mockSignaller.send.mock.calls.length).toBe(1);
            expect(mockSignaller.send.mock.calls[0][0]).toMatchObject(expected_message);
        };
        return mockAnswerPromise.finally(checkPromise);

    });

    test('It adds a stream', () => {
        webRtcSession.handleOffer(message);
        expect(mockPeerConnection.addStream.mock.calls.length).toBe(1);
        expect(mockPeerConnection.addStream.mock.calls[0][0]).toBe(mockStream);
    });

    test('It sets up the remote stream handler', () => {
        let mockStreamHandler = jest.fn((obj) => {});
        let expected_event = {peerId: 'sender', stream: 'stream'};

        webRtcSession.onaddstream = mockStreamHandler;
        webRtcSession.handleOffer(message);

        mockPeerConnection.onaddstream({stream: "stream"});
        expect(mockStreamHandler.mock.calls.length).toBe(1);
        expect(mockStreamHandler.mock.calls[0][0]).toMatchObject(expected_event);
    });
});

describe('WebRtcSession.announceHandler', () => {
    let webRtcSession;
    let message;
    let mockOfferPromise;
    let expected_offer = 'offer';
    beforeEach(() => {
        message = new Message('announce',"",'sender','receiver');
        webRtcSession = new WebRtcSession(mockStream, mockSignaller, options, new SdpParams());
        webRtcSession.peerConnections = peerConnections;

        // Set up createPeer to return a mock peerConnections
        // with a mock implementation of addStream
        mockOfferPromise = Promise.resolve(expected_offer);
        mockPeerConnection = {
            addStream: jest.fn((obj) => {}),
            setLocalDescription: jest.fn((obj) => {}),
            createOffer: jest.fn((obj) => {return mockOfferPromise})
        }
        webRtcSession.createPeer = function(handler) {
            return mockPeerConnection;
        }
    });
    test('It adds the peer connection to the webrtc session', () => {
        webRtcSession.handleAnnounce(message);
        expect(peerConnections.length).toBe(3);
    });
    test('It adds a stream', () => {
        webRtcSession.handleAnnounce(message);
        expect(mockPeerConnection.addStream.mock.calls.length).toBe(1);
        expect(mockPeerConnection.addStream.mock.calls[0][0]).toBe(mockStream);
    });
    test('It sends an offer', () => {
        webRtcSession.handleAnnounce(message);
        
        let expected_message = new Message("offer",expected_offer,"", message.sender_guid);
        let checkPromise = function() {
            expect(mockSignaller.send.mock.calls.length).toBe(1);
            expect(mockSignaller.send.mock.calls[0][0]).toMatchObject(expected_message);
        };
        return mockOfferPromise.finally(checkPromise);
    });
    test('It sets the local description on the peer connection', () => {
        webRtcSession.handleAnnounce(message);
        
        let expected_message = new Message("offer",expected_offer,"", message.sender_guid);
        let checkPromise = function() {
            expect(mockPeerConnection.setLocalDescription.mock.calls.length).toBe(1);
            expect(mockPeerConnection.setLocalDescription.mock.calls[0][0]).toBe(expected_offer);
        };
        return mockOfferPromise.finally(checkPromise);
    });
});

describe('WebRtcSession.handleIceCandidate', () => {
    let webRtcSession;
    let message;
    let expected_candidate = 'candidate';
    beforeEach(() => {
        message = new Message('ice',expected_candidate,'sender','receiver');
        mockPeerConnection = {
            addIceCandidate: jest.fn((obj) => {})
        }
        peerConnections = [
            new Peer('sender', mockPeerConnection),
            new Peer('another', {})
        ];

        webRtcSession = new WebRtcSession(mockStream, mockSignaller, options, new SdpParams());
        webRtcSession.createRTCIceCandidate = jest.fn((obj) => {return obj});
        webRtcSession.peerConnections = peerConnections;

    });
    test('It calls addIceCandidate on the right peerConnection', () => {
        webRtcSession.handleIceCandidate(message);
        expect(mockPeerConnection.addIceCandidate.mock.calls.length).toBe(1);
        expect(mockPeerConnection.addIceCandidate.mock.calls[0][0]).toBe(expected_candidate);
    });
});

describe('WebRtcSession.handleHangup', () => {
    let webRtcSession;
    let message;
    let mockPeer;
    beforeEach(() => {
        message = new Message('hangup','','sender','receiver');
        mockPeer = peerConnections[0]
        mockPeer.connection.close = jest.fn((obj) => {});
        webRtcSession = new WebRtcSession(mockStream, mockSignaller, options, new SdpParams());
        webRtcSession.peerConnections = peerConnections;
    });
    test('It calls onhangup with the right peer id', () => {
        let expected_event = {peerId: 'sender'};
        let mockHangupHandler = jest.fn((event) => {});
        webRtcSession.onhangup = mockHangupHandler;
        
        webRtcSession.handleHangup(message);

        expect(mockHangupHandler.mock.calls.length).toBe(1);
        expect(mockHangupHandler.mock.calls[0][0]).toMatchObject(expected_event);
    });
    test('It removes the right peer connection', () => {
        webRtcSession.handleHangup(message);
        expect(peerConnections.length).toBe(1);
        expect(peerConnections[0].id).toBe('another');
        expect(mockPeer.connection.close.mock.calls.length).toBe(1);
    });
});

