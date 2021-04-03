import {AudioReceiver} from './AudioReceiver';
import {AudioSender} from './AudioSender';

let mockPeerConnection;
let mockAudioContext;
let mockMediaStreamSource = "expected MediaStreamSource";
let mockMediaStreamDestination = "expected MediaStreamDestination";
let workletProcessorPromise = Promise.resolve("unused");
let mockAudioWorkletNode;

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

    mockAudioWorkletNode = {
	connect: jest.fn((node) =>{}),
	port: {
	    postMessage: jest.fn((msg) => {})
	}
    };
    global.AudioWorkletNode = function(context, processorName) {
	return mockAudioWorkletNode;
    };
});

 
test('AudioReceiver constructor creates an audio worklet node on the the audio context', () => {
    global.AudioWorkletNode = function(context, processorName) {
	console.log("MOCK WORKLET NODE");
	expect(context).toBe(mockAudioContext);
	return mockAudioWorkletNode;
    };
    let audioReceiver = new AudioReceiver(mockAudioContext);

    expect(mockAudioContext.audioWorklet.addModule.mock.calls.length).toBe(1);
    expect(mockAudioContext.audioWorklet.addModule.mock.calls[0].length).toBe(1);

});

test('AudioReceiver constructor connects the the worklet node to a media stream destination', () => {
    let audioReceiver = new AudioReceiver(mockAudioContext);

    // Need to wait on promise resolution
    return workletProcessorPromise.finally(() => {
	expect(mockAudioWorkletNode.connect.mock.calls.length).toBe(1);
	expect(mockAudioWorkletNode.connect.mock.calls[0][0]).toBe(mockMediaStreamDestination);
    });
});

// Scrap this test. Instead of testing so deep inside the constructor internals,
// testing should be focused on behavior of the AudioReceiver such as, samples sent
// to 'receiveAudioSamples' end up on the mediaStreamDestination
//test('AudioReceiver constructor sends a shared audio buffer to the worklet node', () => {
//    let audioReceiver = new AudioReceiver(mockAudioContext);
//    let mockSharedBuffer = {}//TODO: You Are Here March 31
//    let expected_message = {
//	type: "receive_buffer",
//	data: mockSharedBuffer
//    }
//
//    // Need to wait on promise resolution
//    return workletProcessorPromise.finally(() => {
//	expect(mockAudioWorkletNode.port.postMessage).toHaveBeenCalled();
//	expect(mockAudioWorkletNode.port.postMessage.mock.calls[0][0]).toBe(expected_message);
//    });
//});

test('AudioReceiver.getMediaStreamDestination returns the expected media stream', () => {
    let audioReceiver = new AudioReceiver(mockAudioContext);
    let testMediaStreamDestination = audioReceiver.getMediaStreamDestination();
    expect(testMediaStreamDestination).toBe(mockMediaStreamDestination);
});

test('AudioReceiver.receiveAudioSamples puts data on the media stream', () => {
    // Idea: this mock will copy directly from a ringbuffer
    // into the mock stream
    mockAudioWorkletNode = {
	connect: jest.fn((node) =>{
	    mockAudioWorkletNode.mockStream = node;
	}),
	port: {
	    postMessage: jest.fn((msg) => {
		//this.sharedBuffer = msg.data;
	    })
	}
    };
    let mockMediaStreamDestination = new Float32Array();

    // Let the receiver use a *real* shared buffer, only mock out the worklet
    
    let audioReceiver = new AudioReceiver(mockAudioContext);
    let sampleData = new Float32Array([1,2,3]);
    let testMediaStreamDestination = audioReceiver.getMediaStreamDestination();

    audioReceiver.receiveAudioSamples(sampleData);

    return workletProcessorPromise.finally(() => {
	expect(mockMediaStreamDestination).toBe(sampleData);
    });


});
