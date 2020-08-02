import React from 'react';
import logo from './logo.svg';
import './App.css';

import Tracks from './components/Tracks';
import Header from './components/Header/Header';
import Container from '@material-ui/core/Container';

class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="App">
                <Header 
                    color="dark"
                    brand="WebRTC Jam"
                />
                <Container maxWidth="lg">
                    <Tracks />
                </Container>
            </div>
        );
  }
}

export default App;
