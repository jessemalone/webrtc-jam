#!/bin/bash

fly -t jsoft login -c https://ci.jsoft.ca -b
fly -t jsoft set-pipeline -p webrtc-jam -c ci/pipeline.yml
