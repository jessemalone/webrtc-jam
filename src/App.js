import React from 'react';
import logo from './logo.svg';
import './App.css';

import {Signaller} from './lib/Signaller';
import {Message} from './lib/Message';
import {SignallingContext} from './lib/SignallingContext.js';

import Tracks from './components/Tracks';
import Header from './components/Header/Header';
import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import AssignmentIcon from '@material-ui/icons/Assignment';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  useParams,
  withRouter
} from "react-router-dom";

let proto = "wss://";
let wsUrl = proto + window.location.host + "/ws";
let apiUrl = "https://" + window.location.host + "/api"
if (window.location.host === "localhost:3000") {
    proto = "ws://";
    wsUrl = proto +"localhost:8765/ws";
    apiUrl = "http://" + "localhost:5000" + "/api"
}
if (window.location.host === "localhost:8780") {
    proto = "ws://";
    wsUrl = proto +"localhost:8780/ws";
    apiUrl = "http://" + "localhost:8780" + "/api"
}
let websocket = new WebSocket(wsUrl);
let signaller = new Signaller(websocket);

class App extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            signalling: {
                websocket: websocket,
                signaller: signaller
            },
            showDialog: true,
            ready: false
        }
    }

    componentDidMount() {
        this.state.signalling.websocket.onopen = this.setUpSignalling;
        // Get room name
        let channelSlug = window.location.pathname.match(/[a-z0-9]+$/)
        let that = this
        if (channelSlug !== null && channelSlug[0] !== "") {
            console.log("FETCH chan" + apiUrl);
            fetch(apiUrl + "/channel/" + channelSlug[0]).then(response => response.json().then(data => that.setState({roomName: data.channel_name})));
        }
    }
    
    setUpSignalling = () => {
        this.roomAckHandler = (ack) => {
            this.setState({roomId: ack.data.channel_id});

            // Redirect to the room
            window.location = window.location + "r/" + ack.data.channel_id + "?SenderInputMS=240&ReceiverInputMS=120&SenderEncodedBytes=3048&SenderFrameMS=5";
        }

        this.handleCreateRoom = (event) => {
            // start the session here
            this.setState({showDialog: false})

            // Use signaller to create the room and get an id
            this.state.signalling.signaller.addHandler("ack",this.roomAckHandler);
            this.state.signalling.signaller.send(new Message("create_channel",{"name":this.state.submittedName},"","",""));
        }
        this.setState({ready: true});
    }

    handleName = (event) => {
        this.setState({submittedName: event.target.value})
    }

    copyToClipboard(event) {
        let element = event.target.parentElement.parentElement.parentElement;
        navigator.clipboard.writeText(window.location);
    }
    
    render() {
      let roomName="Somebody's room"
    let ShareLink = (
        <div><span className="centered">Invite Link: </span><TextField InputProps={{className: "input"}} variant="outlined" color="primary" disabled id="share-link" defaultValue={window.location} /><span title="Copy to Clipboard" class="centered"><Button onClick={this.copyToClipboard}><AssignmentIcon fontSize="large" /></Button></span></div>

    )
        return (
            <div className="App">
                <Header 
                    color="dark"
                    brand={"WebRTC Jam - " + this.state.roomName}
                    rightLinks={ShareLink}
                />
                <Router>
                    <Container maxWidth="lg">
                        { (this.state.ready) &&
                            <SignallingContext.Provider value={ this.state.signalling }>
                                <Route path="/r/:roomid" component={Tracks} />
                            </SignallingContext.Provider>
                        }
                    </Container>
                    <Route exact path="/">
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
                    </Route>
                </Router>
            </div>
        );
  }
}

export default withRouter(App);
