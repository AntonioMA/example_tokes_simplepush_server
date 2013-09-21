#!/bin/sh

while true
do
  if /bin/ps -ef |/bin/grep node1|/bin/grep -v grep > /dev/null
  then
    echo "Node still running, waiting"
  else
    echo "Node not running! Relaunching" &
    LP=$!
    (nohup node autoping.js Woody 300 localhost 80 >> autoping.${LP}.log 2>&1 &)
    echo $! > autoping.${LP}.run
  fi
  sleep 60
done
