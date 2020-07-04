import React from 'react';
import logo from './logo.svg';
import './App.css';

import {Signaller, Message} from './lib';
import Tracks from './components/Tracks';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            peers: [],
            tracks: [],
            signaller: {}
        };
    }

    componentDidMount() {

    }

    componentWillUnmount() {

    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                </header>
                <Tracks />
            </div>
        );
  }
}

export default App;
