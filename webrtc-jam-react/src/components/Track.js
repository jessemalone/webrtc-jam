import React from 'react';

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


    render() {
        console.log("rendered");
        return (
            <div id={ this.props.id } className="track">
                <label className="track-label">{ this.props.name }</label>
                <audio ref={this.audio} controls />
            </div>
        );
    }
}

export {Track}
