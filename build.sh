#!/usr/bin/env bash

docker build -t webrtc-jam -f docker/Dockerfile --build-arg TURN_HOST=${TURN_HOST} --build-arg TURN_USERNAME=${TURN_USERNAME} --build-arg TURN_PASSWORD=${TURN_PASSWORD} .
