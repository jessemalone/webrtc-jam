import React from 'react';

import GridItem from "components/Grid/GridItem.js";
import GridContainer from "components/Grid/GridContainer.js";
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import VolumeOffIcon from '@material-ui/icons/VolumeOff';
import VolumeDownIcon from '@material-ui/icons/VolumeDown';
import Slider from '@material-ui/core/Slider';
import Button from 'components/CustomButtons/Button.js'

class TrackControls extends React.Component {

    state = {
        mic: "on"
    }
    constructor(props) {
        super(props);
        this.state.mic = props.mic;
        if (this.props.toggledMute) {
            this.toggledMute = this.props.toggledMute;
        } else {
            this.toggledMute = () => {};
        }

        if (this.props.volumeChange) {
            this.volumeChange = this.props.volumeChange;
        } else {
            this.volumeChange = (volume) => {};
        }
    }
    componentDidMount() {
        this.componentDidUpdate();
    }
    
    componentDidUpdate() {
        
    }

    volumeChange = (value) => {

    }

    toggleMute = (button) => {
        if (this.state.mic === "off") {
            this.setState({mic: "on"});
            this.toggledMute("on");
        } else {
            this.setState({mic: "off"});
            this.toggledMute("off");
        }
    }

    render() {
        let muteButtonColor = "success";
        let micIcon = <VolumeUpIcon />;
        if (this.state.mic === "off") {
            muteButtonColor = "danger";
            micIcon = <VolumeOffIcon />;
        }
        return (
            <GridContainer alignItems="center">
                <GridItem xs={4}>
                    <Button onClick={this.toggleMute} color={muteButtonColor}>
                        { micIcon }
                    </Button>
                </GridItem>
                <GridItem xs={1}>
                  <VolumeDownIcon />
                </GridItem>
                <GridItem xs={4}>
                  <Slider defaultValue={100} onChange={this.volumeChange} aria-labelledby="volume" />
                </GridItem>
                <GridItem xs={1}>
                  <VolumeUpIcon />
                </GridItem>
            </GridContainer>
        );
    }
}

export default TrackControls
