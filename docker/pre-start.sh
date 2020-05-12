#!/bin/bash

# Start the signalling server before the container launches nginx

/app/server/app.py >>/app/app.py.log &
echo $@
exec $@
