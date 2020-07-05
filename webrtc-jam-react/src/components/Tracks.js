import React from 'react';

import {Signaller} from '../lib/Signaller';
import {WebRtcSession} from '../lib/WebRtcSession';

import {Track} from './Track';
import {TrackLatency} from './TrackLatency';
import GridItem from "components/Grid/GridItem.js";
import GridContainer from "components/Grid/GridContainer.js";
import Paper from '@material-ui/core/Paper';

class Tracks extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            localStream: null,
            streams: [],
            stats: {}
        };
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
            this.startStatsReporting();
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
            let peerIndex = streams.findIndex( peer => peer.id === peerId);
            streams.splice(peerIndex, 1);
            that.setState({streams: streams});
        }
    }
    
    startStatsReporting() {
        let that = this;
        setInterval(() => {
            for (let i in that.state.streams) {
                // find the audio track
                let stream = that.state.streams[i];
                that.webRtcSession.getStats(stream.peerId).then((statsReport) => {
                    let stats = that.state.stats;
                    stats[stream.peerId] = statsReport;
                    that.setState({stats: stats});
                });
            }
        }, 1000);
    }

    render() {
        return (
            <div className="tracks-container">
                <Paper className="local-track track">
                    <GridContainer alignItems="center">
                        <GridItem xs={6}>
                            <Track name="Local" id="local" stream={ this.state.localStream } />
                        </GridItem>
                        <GridItem xs={6}>
                            <TrackLatency />
                        </GridItem>
                    </GridContainer>
                </Paper>
                { this.state.streams.map((stream) => 
                    <Paper className="remote-track track">
                        <GridContainer alignItems="center">
                            <GridItem xs={6}>
                                <Track id={stream.peerId} name={stream.peerId} stream={stream.stream}  />
                            </GridItem>
                            <GridItem xs={6}>
                                <TrackLatency stats={this.state.stats[stream.peerId]} />
                            </GridItem>
                        </GridContainer>
                    </Paper>
                )}
         </div>
        );
    }
}

export default Tracks;
