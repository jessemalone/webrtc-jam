import React from 'react';

class TrackName extends React.Component {

    state = {
        name: "Anonymous"
    };

    componentDidMount() {
       this.props.signaller.addHandler("name", this.updateTrackName);
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
