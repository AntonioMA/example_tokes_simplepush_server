// Automatic push pinger
// Usage: node autoping.js nickname interval [host [port]]
//   * Nickname: Nickname of the user whose friends we'll ping
//   * Interval: Interval in seconds for sending a ping
//   * Host: Host where we'll get the friends from. Defaults to localhost
//   * Port: Port where to connect. Defaults to 8123
// It just sends a 'ping' to all the friends of the nickname

// Take a guess :P
var SERVER_PORT = 8123;
var HOST = 'localhost';

function AutoPing(aNickname, aInterval, aHost, aPort) {
  'use strict';

  var http = require('http');
  var https = require('https');
  var url = require('url');

  var nickname = aNickname;
  var interval = aInterval * 1000;
  var host = aHost;
  var port = aPort;

  function processData(aNext, aRes) {
    var loadedData = '';
    aRes.on('data', function(aChunk) {
      loadedData = loadedData + aChunk;
    });
    aRes.on('end', function() {
      try {
        if (aNext) {
          aNext(loadedData);
        }
      } catch (x) {
        debug('Error %s reading or processing data. Got %s', x, loadedData);
      }
    });
  }

  function doRequest(aReqOptions, aProcessData, aSentData) {
    var req;
    if (aReqOptions.protocol === 'https:') {
      req = https.request(aReqOptions, processData.bind(this, aProcessData));
    } else {
      req = http.request(aReqOptions, processData.bind(this, aProcessData));
    }
    req.on('error', function(e) {
      console.log('Error processing request: %s. %s',
                  JSON.stringify(aReqOptions), e.message);
    });
    if (aSentData) {
      req.write(aSentData);
    }
    req.end();
  }

  function notifyFriend(aFriend) {
    var pushOptions = url.parse(aFriend.endpoint);
    pushOptions.method = 'PUT';
    var version = 'version=' + new Date().getTime();
    debug('Sending version %s to friend %s, endpoint: %s', version,
          aFriend.nick, aFriend.endpoint);
    doRequest(pushOptions, function(data) {
                debug('Got %s as an answer for friend %s, endpoint %s',
                      data, aFriend.nick, aFriend.endpoint);
              }, version);
  }

  function processFriends(aFriendsData) {
    var friends = JSON.parse(aFriendsData);
    // friends is an array of objects. Each object is
    // {'nick':aNick,'endpoint':aEndpoint}
    friends.forEach(function(aFriend) {
      notifyFriend(aFriend);
    });
  }

  function getFriends() {
    debug('Getting friends for %s at %s:%d', nickname, host, port);

    var friendReqOptions = {
      hostname: host,
      port: port,
      path: '/friend/' + nickname,
      method: 'GET'
    };

    doRequest(friendReqOptions, processFriends);
  }


  function debug() {
    var args = Array.prototype.slice.call(arguments);
    var format = "(%s) - " + args.shift();
    args.unshift(new Date().toLocaleString());
    args.unshift(format);
    console.log.apply(console, args);
  }

  function start() {
    debug('Starting to send pings as user %s every %d seconds',
          nickname, interval / 1000);
    setInterval(getFriends, interval);
  }


  return {
    start: start
  };

}

if (process.argv.length < 4) {
  console.log('Error: This must be invoked with at least two arguments.');
  console.log('Usage: node autoping.js nickname interval [host [port]]');
} else {

  process.on('exit', function() {
    console.log("Node process exiting!");
  });
  var signals = [ 'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGUSR1',
                  'SIGSEGV', 'SIGPIPE', 'SIGALRM', 'SIGTERM'];
  for (var i = 0; i<signals.length; i++) {
    console.log("Setting handler " + signals[i]);
    process.on(signals[i], function(aSignal) {
      console.log(aSignal + " captured! Exiting now");
      process.exit(1);
    }.bind(undefined, signals[i]));
  }

  process.on('SIGINT', function() {
    console.log("SIGINT captured! Exiting now");
    process.exit(1);
  });
  var host = process.argv[4] || HOST;
  var port = process.argv[5] || SERVER_PORT;
  var autoping = new AutoPing(process.argv[2], process.argv[3], host, port);
  autoping.start();
}
