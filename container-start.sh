#!/bin/bash

/app/app.py >>/app/app.py.log &
echo $@
exec $@
