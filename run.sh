#!/usr/bin/env bash

script_root=$(cd "$(dirname $0)" && pwd)
cd $script_root/nodejs && node server.js &
cd $script_root/react && npm run dev