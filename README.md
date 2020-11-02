### Run the tests:

##### Frontend:

```
npm install
npm run test
```

#### Server:
```
pushd server
make install
make test
popd
```

### Run in docker:

```
TURN_HOST=<turn server address>
TURN_USERNAME=<turn server username>
TURN_PASSWORD=<turn server password>
./build.sh
npm install
npm run serve
```

It should come up at localhost:8780

### OR Install dependencies for running locally:

Requires python >= 3.7.4
```
pushd server
  make install
popd
npm install
```


