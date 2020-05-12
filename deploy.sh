#!/usr/bin/env bash

echo "Get deployment environment from lastpass"

eval "$(lpass show --notes "infrastructure/webrtc-jam_production")"

echo "Deploy to caprover"

caprover deploy --appName $APP_NAME --branch master --host $CAPROVER_HOST --pass $CAPROVER_PASSWORD
