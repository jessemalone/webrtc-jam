import React from 'react';

class Track extends React.Component {

    constructor(props) {
        super(props);
        this.audio = React.createRef();
    }
    componentDidMount() {
        console.log("didmount");
        this.audio.current.srcObject = this.props.stream;
    }
    componentDidUpdate() {
        console.log("didupdate");
        this.audio.current.srcObject = this.props.stream;
    }

    render() {
        console.log("rendered");
        return (
            <div id={ this.props.id } className="track">
                <label className="track-label">{ this.props.name }</label>
                <div className="track-latency"></div>
                <audio ref={this.audio} controls />
            </div>
        );
    }
}

export {Track}
