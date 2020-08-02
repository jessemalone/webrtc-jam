import React from 'react';

import {Signaller} from '../lib/Signaller';
import {WebRtcSession} from '../lib/WebRtcSession';
import {Message} from '../lib/Message';

import {Track} from './Track';
import {TrackLatency} from './TrackLatency';
import {TrackName} from './TrackName';
import GridItem from "components/Grid/GridItem.js";
import GridContainer from "components/Grid/GridContainer.js";
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';


class Tracks extends React.Component {
    options = {
        offerToReceiveAudio: 1,
    }

    constructor(props) {
        super(props);
        this.state = {
            localStream: null,
            streams: [],
            stats: {},
            started: false,
        };
        this.websocket = {};
        this.signaller = {};
        this.name = "";

        this.nameFieldRef = React.createRef();
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


        let proto = "wss://";
        let wsUrl = proto + window.location.host + "/ws";
        if (window.location.host === "localhost:3000") {
            proto = "ws://";
            wsUrl = proto +"localhost:8780/ws";
        }
        this.websocket = new WebSocket(wsUrl);
        this.signaller = new Signaller(this.websocket);

        this.websocket.onopen = () => {
            navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
                .then(this.webRtcSessionStarter()).catch((e) => {console.log(e)});
        };
    }
    
    webRtcSessionStarter() {
        return (stream) => {
            this.setState({localStream: stream});
            this.webRtcSession = 
                new WebRtcSession(
                    this.state.localStream,
                    this.signaller,
                    this.options
                );

            // set up handlers for add / remove stream
            this.webRtcSession.onaddstream = this.getAddStreamHandler();
            this.webRtcSession.onhangup = this.getRemoveStreamHandler();

            // ==================================================================//  
            // ** START **
            this.signaller.announce();
            this.startStatsReporting();

            this.setState({started: true});
        };
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
            let peerIndex = streams.findIndex( stream => stream.peerId === peerId);
            streams.splice(peerIndex, 1);
            that.setState({streams: streams});
        }
    }
    
    startStatsReporting() {
        let that = this;
        setInterval(() => {
            if (this.signaller) {
                this.signaller.send(new Message("name",{"name": this.name},"",""));
        }
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

    setName = (event) => {
        if (event.key && event.key != 'Enter') {
            return;
        }

        if (this.signaller) {
           this.signaller.send(new Message("name",{"name": event.target.value},"",""));
        }
        this.name = event.target.value;

        if (event.key === 'Enter') {
            event.target.blur();
        }
    }


    render() {
        return (
            <div className="tracks-container">
                <Paper className="local-track track">
                    <GridContainer alignItems="center">
                        <GridItem xs={2}>
                            <TextField ref={this.nameFieldRef} disabled={!this.state.started} onKeyDown={this.setName} onChange={this.setName} id="my-name" label="My Name" variant="outlined" />
                        </GridItem>
                        <GridItem xs={4}>
                            <Track name="Local" id="local" stream={ this.state.localStream } />
                        </GridItem>
                        <GridItem xs={6}>
                            <div class="track-latency">Local Track</div>
                        </GridItem>
                    </GridContainer>
                </Paper>
                { this.state.streams.map((stream) => 
                    <Paper className="remote-track track">
                        <GridContainer alignItems="center">
                            <GridItem xs={2}>
                                <TrackName peerId={stream.peerId} signaller={ this.signaller } />
                            </GridItem>
                            <GridItem xs={4}>
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
