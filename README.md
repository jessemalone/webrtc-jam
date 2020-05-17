### Run the tests:

##### Frontend:

```
npm install
npm run test
```

#### Server:
```
pip3 install -r server/requirements.txt
pushd server
./run_tests.sh
popd
```

### Run in docker:

```
docker build -t webrtc-jam -f docker/Dockerfile .
npm install
npm run serve
```

It should come up at localhost:8780

### OR Install dependencies for running locally:

Requires python >= 3.7.4
```
pip install -r server/requirements.txt
npm install
```


