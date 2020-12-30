import React from 'react';
import logo from './logo.svg';
import './App.css';

import {Signaller} from './lib/Signaller';
import {SignallingContext} from './lib/SignallingContext.js';

import Tracks from './components/Tracks';
import Header from './components/Header/Header';
import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';



class App extends React.Component {
    // YOU ARE HERE: Use "Context" to pass around websocket and signaller
    constructor(props) {
        super(props);
        let proto = "wss://";
        let wsUrl = proto + window.location.host + "/ws";
        if (window.location.host === "localhost:3000") {
            proto = "ws://";
            wsUrl = proto +"localhost:8780/ws";
        }
        let ws = new WebSocket(wsUrl);
        let signaller = new Signaller(ws);

        this.state = {
            signalling: {
                websocket: ws,
                signaller: signaller
            },
            showDialog: true,
            roomName: ""
        }
    }

    handleName = (event) => {
        this.setState({submittedName: event.target.value})
    }
    handleCreateRoom = (event) => {
        // start the session here
        this.setState({roomName: this.state.submittedName})
        this.setState({showDialog: false})
    }

    render() {
        return (
            <div className="App">
                <Header 
                    color="dark"
                    brand="WebRTC Jam"
                />
                <Container maxWidth="lg">
                    <SignallingContext.Provider value={ this.state.signalling }>
                        <Tracks roomId={this.state.roomName} signaller={this.state.signaller} websocket={this.state.websocket} />
                    </SignallingContext.Provider>
                </Container>
                <Dialog open={this.state.showDialog}>
                    <DialogTitle id="create-room">Create A Room</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Once you create a room you'll be get a link you can share with people you want to invite.
                        </DialogContentText>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="room_name"
                            label="Room Name"
                            type="input"
                            onChange={ this.handleName }
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button color="primary" onClick={ this.handleCreateRoom }>
                            Go
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
  }
}

export default App;
