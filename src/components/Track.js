import React from 'react';

import GridItem from "components/Grid/GridItem.js";
import GridContainer from "components/Grid/GridContainer.js";
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
import Button from 'components/CustomButtons/Button.js'

import TrackControls from 'components/TrackControls.js'

class Track extends React.Component {

    latency = "Unknown";

    constructor(props) {
        super(props);
        this.audio = React.createRef();
    }
    componentDidMount() {
        this.componentDidUpdate();
    }
    componentDidUpdate() {
        console.log("didupdate");
        this.audio.current.srcObject = this.props.stream;
    }
    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.stream !== this.props.stream) {
            return true;
        } else if (nextProps.name !== this.props.name) {
            return true;
        } else {
            return false;
        }
    }

    volumeChange = (event, volume) => {
        console.log(volume);
        this.audio.current.volume = (volume / 100).toFixed(2);
    }
    toggledMute = (state) => {
        if (state === "on") {
            this.audio.current.play();
        } else {
            this.audio.current.pause();
        }
    }

    updateTrackName = (message) => {
        let streams = this.state.streams;
        let stream = streams.find( stream => stream.peerId === message.sender_guid);
    }

    render() {
        console.log("rendered");
        return (
            <GridContainer alignItems="center">
                <GridItem xs={12}>
                    <audio ref={this.audio} />
                    <TrackControls mic="off" toggledMute={ this.toggledMute } volumeChange={ this.volumeChange } />
                </GridItem>
            </GridContainer>
        );
    }
}

export {Track}
