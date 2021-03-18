
const mediaStreamConstraints = {
    audio: {
        autoGainContol: false,
        echoCancellation: false,
        latency: 0.0001, // This is only supported by chrome
        noiseSuppression: false,
        channelCount: 1
    },
    video: false
}

            if (window.isSecureContext) {
                console.log("secure");
            }
            if (crossOriginIsolated) {
console.log("cross isolated ssssss");
                        }

console.log("Hmmxxxxxxxxm");
async function sendAudio(sharedAudioBuffer, sharedStateBuffer) {
    // YOU ARE HERE: this has to happen in a worklet. Good luck
    states = new Int32Array(sharedStateBuffer);
    Atomics.store(states,SBDestinationWorkletNode.STATES.READY_TO_READ, 1);
    Atomics.notify(states,SBDestinationWorkletNode.STATES.READY_TO_READ, 1);
    while (true) {
        Atomics.wait(states,SBDestinationWorkletNode.STATES.READY_TO_SEND, 0);
        Atomics.store(states,SBDestinationWorkletNode.STATES.READY_TO_SEND, 0);

        // push data from the shared audio buffer
        await console.log("got data to send");

        Atomics.store(states,SBDestinationWorkletNode.STATES.READY_TO_READ, 1);
        Atomics.notify(states,SBDestinationWorkletNode.STATES.READY_TO_READ, 1);

    }
}

async function gotLocalMediaStream(stream) {
                console.log("got media stream");
    const STATES = {
        'READY_FOR_INPUT': 0,
        'READY_FOR_OUTPUT': 1
    }
    const bytesPerSample = SBDestinationWorkletNode.bytesPerSample;
    const bytesPerState = SBDestinationWorkletNode.bytesPerState;

    // initialize buffers
    sharedAudioBuffer = new SharedArrayBuffer(128*SBDestinationWorkletNode.bytesPerSample);
    sharedSignalBuffer = new SharedArrayBuffer(Object.entries(SBDestinationWorkletNode.STATES).length * bytesPerState);

    // initialize contextx
    ctx = new AudioContext({"latencyHint": 0.0001});
    ctx2 = new AudioContext({"latencyHint": 0.0001});
    player = document.getElementById('player');
    //player.srcObject = stream;

    // initialize destination worklet node
    // this node will receive audio from the context to be streamed
    source = ctx.createMediaStreamSource(stream);
    await ctx.audioWorklet.addModule("/playground/sb-destination-worklet-processor.js");
    node = new SBDestinationWorkletNode(ctx, sharedAudioBuffer, sharedSignalBuffer);
    node.onInitialized = () => {
        console.log("node initialized");
        source.connect(node)
        sendAudio(sharedAudioBuffer, sharedSignalBuffer);
    }

//    node.port.onmessage = (e) => {
//                let bufsrc = ctx2.createBufferSource();
//                let input = e.data;
//                let channel = 0
//
//                if (input[channel]) {
//                    let buf = ctx2.createBuffer(1, input[channel].length,ctx2.sampleRate);
//
//                    writebuf = buf.getChannelData(channel);
//                    for (var i = 0; i <= input[channel].length; ++i) {
//                       writebuf[i] = input[channel][i]
//                    }
//
//                    bufsrc.buffer = buf;
//                    bufsrc.connect(ctx2.destination)
//                    bufsrc.start();
//                }
//
//                }
    
    
    
    //dest = new Audio().srcObject = stream;
    //dest = ctx.createMediaStreamDestination();
    //source.connect(ctx.destination);
    //source.connect(dest);


}

    navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
        .then(gotLocalMediaStream);


