## WebRTC Jam

WebRTC Jam is an attempt at using webrtc for web based remote music collaboration. It is still very much experimental and still has enough latency that it's probably not at all usable for more than two participants. 


### Quickstart

#### Prerequisites

This project requires a [turn server](https://webrtc.org/getting-started/turn-server) in order to function so you will need to set one up ahead of time. Once you have a turn server you need to provide the credentials for it as environment variables at runtime.

[Coturn](https://github.com/coturn/coturn) is a good option. There are also numerous hosted solutions available.

(This requirement is something that should become optional in the future)

#### Build the docker image

```
npm run build-docker
```

#### Setup the environment

```
export TURN_HOST=<turn server address>
export TURN_USERNAME=<turn server username>
export TURN_PASSWORD=<turn server password>
```

#### Run the container

```
npm run serve
```

The application will be available at localhost:8780


### Development

### Run the tests:

##### Frontend tests:

```
npm install
npm run test
```

#### Run the frontend dev server

```
npm start
```

The dev server will come up at localhost:3000

#### Server tests:
```
pushd server
make install
make test
popd
```

#### Run the server locally:
```
cd server
make install
make run
```

It will listen for websockets at localhost:8765 and the rest api will be available at localhost:5000



