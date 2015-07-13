#!/bin/sh

while true
do
  echo "Launching Autoping" &
  LP=$!
  node autoping.js Woody 1500 localhost 80 > autoping.${LP}.log 2>&1 
  echo "Node died, will relaunch" 
done
