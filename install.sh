#!/usr/bin/env bash

script_root=$(cd "$(dirname $0)" && pwd)
cd $script_root/nodejs && npm i
cd $script_root/react && npm i
