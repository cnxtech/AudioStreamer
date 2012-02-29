/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , WebSocketServer = require('ws').Server;

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  var WS_HOST = 'ws://localhost:3000';
  var HOST_PORT = '3000';
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  var WS_HOST = 'ws://agektmr.node-ninja.com';
  var HOST_PORT = '80';
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);
// app.get('/play', routes.play);

var listeners = [],
    players = [];
app.listen(HOST_PORT, function() {
  var wsp = new WebSocketServer({server:app, path:'/play'});
  var wsl = new WebSocketServer({server:app, path:'/listen'});
  wsp.on('connection', function(ws) {
    players.push(ws);
    console.log('player opened a connection.');
    ws.on('message', function(buffer) {
      console.log('player received a message:', buffer); 
      var length = buffer.length;
      var binary = new Uint8Array(length);
      for (var i = 0; i < length; i++) {
        binary[i] = buffer.readUInt8(i);
      };
      for (var i = 0; i < listeners.length; i++) {
        // if (listeners[i] == ws) continue;
        if (i == 0) continue;
        listeners[i].send(binary, {binary:true, mask:false});
      };
    });
    ws.on('close', function() {
      console.log('player closed connection.')
      for (var i = 0; i < players.length; i ++) {
        if (players[i] == ws) {
          players.splice(i, 1);
          break;
        }
      }
    });
    ws.on('error', function() {
    });
  });
  wsl.on('connection', function(ws) {
    var name = '';
    listeners.push(ws);
    console.log('listener opened a connection.');
    ws.on('message', function(message) {
      console.log('received a message: "'+message+'"');  
      for (var i = 0; i < listeners.length; i++) {
        if (name == '') {
          name = message;
          listeners[i].send(message+' opened a connection.');
        } else {
          listeners[i].send(name+': '+message);
        }
      }
    })
    ws.on('close', function() {
      console.log('listener closed the connection.');
      for (var i = 0; i < listeners.length; i++) {
        if (listeners[i] == ws) {
          listeners.splice(i, 1);
          break;
        }
      }
    });
    ws.on('error', function() {
    });
 })
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
