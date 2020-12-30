import React from 'react';

import {SignallingContext} from '../lib/SignallingContext.js';

class TrackName extends React.Component {
    static contextType = SignallingContext

    state = {
        name: "Anonymous"
    };

    componentDidMount() {
       this.context.signaller.addHandler("name", this.updateTrackName);
    }

    updateTrackName = (message) => {
        let streams = this.state.streams;
        let name = "Anonymous"
        if (message.data.name != "") {
            name = message.data.name;
        }
        if (message.sender_guid == this.props.peerId) {
            this.setState({"name": name});
        }
    }

    render() {
        return (
            <div id={ this.props.peerId } className="track-name">{ this.state.name }</div>
        );
    }
}

export {TrackName}
