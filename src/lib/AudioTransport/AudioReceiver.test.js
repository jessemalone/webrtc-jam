import {AudioReceiver} from './AudioReceiver';
import {AudioSender} from './AudioSender';

let mockPeerConnection;
let mockAudioContext;
let mockMediaStreamSource = "expected MediaStreamSource";
let mockMediaStreamDestination = "expected MediaStreamDestination";
let workletProcessorPromise = Promise.resolve("unused");

beforeEach(() => {
    mockPeerConnection = {};

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
});

 
test('AudioReceiver constructor creates an audio worklet node on the the audio context', () => {
    global.AudioWorkletNode = function(context, processorName) {
	console.log("MOCK WORKLET NODE");
	expect(context).toBe(mockAudioContext);
	return {};
    };
    let audioReceiver = new AudioReceiver(mockAudioContext);

    expect(mockAudioContext.audioWorklet.addModule.mock.calls.length).toBe(1);
    expect(mockAudioContext.audioWorklet.addModule.mock.calls[0].length).toBe(1);

});

test('AudioReceiver constructor connects the the worklet node to a media stream destination', () => {

});

test('AudioReceiver constructor sends a shared audio buffer to the worklet node', () => {

});

test('AudioReceiver.getMediaStreamDestination returns the expected media stream', () => {
    let audioReceiver = new AudioReceiver(mockAudioContext);
    let testMediaStreamDestination = audioReceiver.getMediaStreamDestination();
    expect(testMediaStreamDestination).toBe(mockMediaStreamDestination);
});
