import {DataChannelAudioTransport} from './DataChannelAudioTransport';
import {AudioReceiver} from './AudioReceiver';
import {AudioSender} from './AudioSender';

let mockPeerConnection;
let mockDataChannel;
let mockAudioContext;
let mockMediaStreamSource = "expected MediaStreamSource";
let mockMediaStreamDestination = "expected MediaStreamDestination";
let workletProcessorPromise = Promise.resolve("unused");
let mockAudioWorkletNode

let audioReceiver;
let audioSender;

let audioTransportUnderTest;

describe('DataChannelAudioTransport', () => {
    beforeEach(() => {
	mockDataChannel = {
	    channel: {},
	    send: jest.fn((msg) => {})
	}
	mockPeerConnection = {
	    createDataChannel: jest.fn((name) => mockDataChannel)
	};
	mockAudioContext = {
            audioWorklet: {
		addModule: jest.fn((srcfile) => {
		    return workletProcessorPromise;
		}),
            },
            createMediaStreamDestination:
            jest.fn(() => mockMediaStreamDestination),
            createMediaStreamSource:
            jest.fn((stream) => mockMediaStreamSource),
	};

	// audioReceiver = new AudioReceiver(mockAudioContext);
	// audioSender = new AudioSender(mockAudioContext);
	audioReceiver = {
	    getMediaStreamDestination: jest.fn(()=>mockMediaStreamDestination)
	};
	audioSender = {
	    send: jest.fn((stream,callback)=>{
		callback(stream);
	    })
	};
	audioTransportUnderTest = new DataChannelAudioTransport(
            mockPeerConnection,
            audioSender,
            audioReceiver
	);

	// Mock the global AudioWorkletNode to return a mock
	// TODO: This mock now occurs in two test suites, find a way
	//       to eliminate the duplication. Maybe mock AudioReceiver
	//       in this suite 
	mockAudioWorkletNode = {
	    connect: jest.fn((node) =>{return true;}),
	    port: {
		postMessage: jest.fn((msg) => {})
	    }
	};
    });

    describe('DataChannelAudioTransport.addStreamHandler', () => {
	it('sends messages from the data channel to the audioReceiver', () => {
	    let expectedMessage = {
		data: "msg"
	    };
	    let MockDataChannel = {}
	    let mockDataChannelEvent = {
		channel: mockDataChannel
	    };

	    audioTransportUnderTest.addStreamHandler((stream) => {});

	    audioReceiver.receiveAudioSamples = jest.fn((samples) => {
		// Use a mock to Validate that it sends the
		// expected data to the audioReceiver
		expect(samples).toBe(expectedMessage.data);
	    });
	    mockPeerConnection.ondatachannel(mockDataChannelEvent);
	    mockDataChannel.onmessage(expectedMessage);

	    // Assert that that it sends some data to the audio receiver
	    expect(audioReceiver.receiveAudioSamples.mock.calls.length).toBe(1);
	});

	it('calls the callback with the audio stream', () => {
	    let testCallback = jest.fn((stream) => {
		expect(stream).toBe(mockMediaStreamDestination);
	    });
	    audioTransportUnderTest.addStreamHandler(testCallback);
	    expect(testCallback.mock.calls.length).toBe(1);

	});
    });

    describe('DataChannelAudioTransport.addStream', () => {
	it('sets the stream on an audioSender', () => {
	    let mockStream = {name: "mockStream"};
	    audioTransportUnderTest.addStream(mockStream);
	    
	    expect(audioSender.send).toHaveBeenCalled();
	    expect(audioSender.send.mock.calls[0][0]).toBe(mockStream);
	});

	it('opens a datachannel', () => {
	    let mockStream = {name: "mockStream"};
	    audioTransportUnderTest.addStream(mockStream);

	    expect(mockPeerConnection.createDataChannel).toHaveBeenCalled();
	});

	it('sends audio from the sender to the datachannel via a callback', () => {
	    let expectedData = {name: "mockStream"};
	    audioTransportUnderTest.addStream(expectedData);

	    expect(audioSender.send).toHaveBeenCalledWith(expectedData, expect.anything());
	    expect(mockDataChannel.send).toHaveBeenCalledWith(expectedData);
	});
    });
});
