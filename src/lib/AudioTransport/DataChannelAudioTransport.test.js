import {DataChannelAudioTransport} from './DataChannelAudioTransport'
import AudioReceiver from './AudioReceiver.js'

let mockPeerConnection;
let mockAudioContext;

beforeEach(() => {
    mockPeerConnection = {};
    mockMediaStreamDestination = {};
    mockMediaStreamSource = {};
    mockAudioContext = {
        audioWorklet: {
            addModule: jest.fn((srcfile) => {}),
        },
        createMediaStreamDestination:
            jest.fn(() => mockMediaStreamDestination),
        createMediaStreamSource:
            jest.fn(() => mockMediaStreamSource),
    };
});

test('DataChannelAudioTransport.addStreamHandler calls the callback when there is audio on the data channel', () => {
    audioReceiver = new AudioReceiver(mockAudioContext);
    audioTransport = new DataChannelAudioTransport(
        mockPeerConnection,
        audioReceiver,
        mockAudioReceiver
    );
    testCallback = (stream) => {
        // assert stream is mockMediaStreamDestination
        // YOU ARE HERE: Do we need a callback if the stream is passed in
        // from outside? The caller already has it
    }
    audioTransport.addStreamHandler(testCallback);


});

test('DataChannelAudioTransport.addStream passes audio from the AudioSender to the data channel', () => {

});

