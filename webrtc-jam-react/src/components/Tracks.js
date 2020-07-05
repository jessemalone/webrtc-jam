import React from 'react';

import {Signaller} from '../lib/Signaller';
import {WebRtcSession} from '../lib/WebRtcSession';

import {Track} from './Track';

class Tracks extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            localStream: null,
            streams: []
        };
        this.streams = [];
    }

    componentDidMount() {
        const mediaStreamConstraints = {
            audio: {
                autoGainContol: false,
                echoCancellation: false,
                latency: 0.005,
                noiseSuppression: false,
                channelCount: 1
            },
            video: false
        }
        navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
            .then(this.webRtcSessionStarter(this)).catch((e) => {console.log(e)});
    }
    
    webRtcSessionStarter(that) {
        return (stream) => {
            that.setState({localStream: stream});
            const options = {
                offerToReceiveAudio: 1,
            }
            let proto = "wss://";
            let wsUrl = proto + window.location.host + "/ws";
            if (window.location.host === "localhost:3000") {
                proto = "ws://";
                wsUrl = proto +"localhost:8780/ws";
            }
            that.websocket = new WebSocket(wsUrl);
            that.signaller = new Signaller(this.websocket);
            that.webRtcSession = 
                new WebRtcSession(
                    that.state.localStream,
                    that.signaller,
                    options
                );

            // set up handlers for add / remove stream
            that.webRtcSession.onaddstream = that.getAddStreamHandler();
            that.webRtcSession.onhangup = that.getRemoveStreamHandler();

            // ==================================================================//  
            // ** START **
            that.websocket.onopen = function() {
                that.signaller.announce();
            }
        };
    }

    componentWillUnmount() {
    }

    getAddStreamHandler() {
        let that = this;
        return function(stream) {
            let streams = that.state.streams;
            streams.push(stream);
            that.setState({streams: streams});
            
        }
    }

    getRemoveStreamHandler() {
        let that = this;
        return function(peerId) {
            let streams = that.state.streams;
            let peerIndex = streams.findIndex( peer => peer.id == peerId);
            streams.splice(peerIndex, 1);
            that.setState({streams: streams});
        }
    }

    render() {
        return (
            <div className="tracks">
                <div className="local-track">
                    <Track name="Local" id="local" stream={ this.state.localStream } />
                </div>
                <div className="remote-tracks">
                { this.state.streams.map((stream) => 
                    <Track id={stream.peerId} name={stream.peerId} stream={stream.stream} />
                )}
                </div>
            </div>
        );
    }
}

export default Tracks;
