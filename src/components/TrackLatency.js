import React from 'react';

class TrackLatency extends React.Component {

    latency = "Unknown";

    componentDidMount() {
        this.componentDidUpdate();
    }
    componentDidUpdate() {
        if (this.props.stats != null) {
            this.updateStats();
        }
    }

    updateStats() {
        this.props.stats.forEach((entry) => {
            if (entry.roundTripTime != null) {
                this.latency = entry.roundTripTime;
                return;
            }
        });
    }

    render() {
        return (
            <div className="track-latency">Network Latency: { this.latency } (s)</div>
        );
    }
}

export {TrackLatency}
