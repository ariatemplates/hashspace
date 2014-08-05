#!/bin/sh

npm install --silent mind-the-bulk humanize cli-table && node build/size $*
