import * as dcat from './DataChannelAudioTransport';

let DataChannelAudioTransport = dcat.DataChannelAudioTransport;
let mockPeerConnection;
let mockDataChannel;
let mockAudioContext;
let mockMediaStreamSource = "expected MediaStreamSource";
let mockMediaStreamDestination = "expected MediaStreamDestination";
let workletProcessorPromise = Promise.resolve("unused");


let mockAudioReceiver;
let mockAudioSender;
let mockAudioWorkletNode;

let audioTransportPromise;
let audioTransportUnderTest;


describe('DataChannelAudioTransport',() => {
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
	mockAudioReceiver = {
	    getMediaStreamDestination: jest.fn(()=>mockMediaStreamDestination)
	};
	mockAudioSender = {
	    send: jest.fn((stream,callback)=>{
		callback(stream);
	    }),
	    stop: jest.fn(()=>{
	    })
	};

        dcat.createAudioReceiver = jest.fn(ctx => mockAudioReceiver);
        dcat.createAudioSender = jest.fn(ctx => mockAudioSender);
        audioTransportPromise = new DataChannelAudioTransport(mockPeerConnection, mockAudioContext);

        // TODO: this is brittle but I'm getting lucky
        audioTransportPromise.then(p => {
            audioTransportUnderTest = p
        });

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

    // describe('createAudioSender()', () => {
    //     it('returns a promise that resolves with the initialized AudioSender', () => {
    //         audioSenderPromise = createAudioSender(mockAudioContext);

    //         let checkPromise = function(p) {
    //             expect(p.context).toBe(mockAudioContext)
    //         }
    //         audioSenderPromise.finally(checkPromise);
    //     });
    // });
    // describe('createAudioReceiver()', () => {
    //     it('returns a promise that resolves with the initialized AudioReceiver', () => {

    //     });
    // });

    describe('DataChannelAudioTransport', () => {
        it('returns a promise that resolves when the transport is ready to receive streams', () => {
            let audioTransport;
            audioTransportPromise.then(p => {
                audioTransport = p
            });
            let checkPromise = function() {
                expect(audioTransport.audioSender).toBe(mockAudioSender);
                expect(audioTransport.audioReceiver).toBe(mockAudioReceiver);
            }
            audioTransportPromise.finally(checkPromise);

        });
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

	    mockAudioReceiver.receiveAudioSamples = jest.fn((samples) => {
		// Use a mock to Validate that it sends the
		// expected data to the audioReceiver
		expect(samples).toBe(expectedMessage.data);
	    });
	    mockPeerConnection.ondatachannel(mockDataChannelEvent);
	    mockDataChannel.onmessage(expectedMessage);

	    // Assert that that it sends some data to the audio receiver
	    expect(mockAudioReceiver.receiveAudioSamples.mock.calls.length).toBe(1);
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

	it('opens a datachannel', () => {
	    let mockStream = {name: "mockStream"};
	    audioTransportUnderTest.addStream(mockStream);

	    expect(mockPeerConnection.createDataChannel).toHaveBeenCalled();
	});

	it('sets the stream on an audioSender *after* the datachannel opens', () => {
	    let mockStream = {name: "mockStream"};
	    audioTransportUnderTest.addStream(mockStream);
	    expect(mockAudioSender.send).toHaveBeenCalledTimes(0);
	    mockDataChannel.onopen({});
	    expect(mockAudioSender.send).toHaveBeenCalled();
	    expect(mockAudioSender.send.mock.calls[0][0]).toBe(mockStream);
	});

	it('sends audio from the sender to the datachannel via a callback', () => {
            let expectedData = {name: "mockStream"};
	    audioTransportUnderTest.addStream(expectedData);

	    expect(mockAudioSender.send).toHaveBeenCalledTimes(0);
	    mockDataChannel.onopen({});

	    expect(mockAudioSender.send).toHaveBeenCalledWith(expectedData, expect.anything());
	    expect(mockDataChannel.send).toHaveBeenCalledWith(expectedData);
	});
        describe('when the stream is already set', () => {
            it('raises an error', () => {
                let expectedData = {name: "mockStream"};
                audioTransportUnderTest.addStream(expectedData);

                expect(mockAudioSender.send).toHaveBeenCalledTimes(0);
                mockDataChannel.onopen({});

                expect(() => {
                    audioTransportUnderTest.addStream(expectedData)
                }).toThrow('Multiple streams not implemented');
            });
        });
    });

    describe('DataChannelAudioTransport.close', () => {
        it('calls stop() on the audioSender', () => {
            audioTransportUnderTest.close();
            expect(mockAudioSender.stop).toHaveBeenCalled();
        });
    });

});
