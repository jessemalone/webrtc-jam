import {DataChannelAudioTransport} from './DataChannelAudioTransport';
import {AudioReceiver} from './AudioReceiver';
import {AudioSender} from './AudioSender';

let mockPeerConnection;
let mockDataChannel;
let mockAudioContext;
let mockMediaStreamSource = "expected MediaStreamSource";
let mockMediaStreamDestination = "expected MediaStreamDestination";
let workletProcessorPromise = Promise.resolve("unused");
global.AudioWorkletNode = jest.fn((a,b) => {});

let audioReceiver;
let audioSender;

let audioTransportUnderTest;
beforeEach(() => {
    mockPeerConnection = {};
    mockDataChannel = {
	channel: {}
    }
    mockAudioContext = {
        audioWorklet: {
            addModule: jest.fn((srcfile) => {
		return workletProcessorPromise;
	    }),
        },
        createMediaStreamDestination:
            jest.fn(() => mockMediaStreamDestination),
        createMediaStreamSource:
            jest.fn(() => mockMediaStreamSource),
    };

    audioReceiver = new AudioReceiver(mockAudioContext);
    audioSender = new AudioSender(mockAudioContext);
    audioTransportUnderTest = new DataChannelAudioTransport(
        mockPeerConnection,
        audioSender,
        audioReceiver
    );
});

test('DataChannelAudioTransport.addStreamHandler sends messages from the data channel to the audioReceiver', () => {
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

test('DataChannelAudioTransport.addStreamHandler calls the callback when there is audio on the data channel', () => {
    let testCallback = jest.fn((stream) => {
	expect(stream).toBe(mockMediaStreamDestination);
    });
    audioTransportUnderTest.addStreamHandler(testCallback);
    expect(testCallback.mock.calls.length).toBe(1);

});

test('DataChannelAudioTransport.addStream passes audio from the AudioSender to the data channel', () => {

});













