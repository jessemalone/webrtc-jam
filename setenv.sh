#!/usr/bin/env bash

set -a
echo "Get deployment environment from lastpass"

eval "$(lpass show --notes "infrastructure/webrtc-jam_production")"

