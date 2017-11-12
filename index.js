var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

mongoose.Promise = global.Promise;
var mongoPromise = mongoose.connect('mongodb://localhost/chat');

var MessageModel = require('./models').MessageModel;
var ConnectionModel = require('./models').ConnectionModel;


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/clients', function(req, res){
  res.contentType('application/json');
  res.status(200);
  const clients = io.engine.clients;
  const ips = [];
  Object.keys(clients).forEach(function(id){
    ips.push(clients[id].remoteAddress);
    console.log(clients[id].remoteAddress);
  });
  res.json({'clients': ips});
});

app.post("/", bodyParser.json(), function (request, response) {
  if(!request.body) return response.sendStatus(400);
  var message = new MessageModel({ip: request.connection.remoteAddress, body: request.body.message});
  message.save(function(err, msg) {
    if (err) console.error(err);
    else console.log('Message successfully saved');
  });
  io.emit('chat message', request.body.message, request.connection.remoteAddress);
  response.send('message sended');
});

io.on('connection', function(socket){
  const ip = socket.client.conn.remoteAddress;
  console.log('a user connected with ip ', ip);
  ConnectionModel.findOneAndUpdate({ip: ip}, {$push: {connections: {date: Date.now(), event: 'connected'}}}, {upsert: true}).then(function(result){
    console.log(result);
  }).catch(function(err){
    console.error(err);
  });

  var name = ip;
  socket.broadcast.emit('newUser', name);
  socket.emit('userName', name);

  socket.on('chat message', function(msg){
    var message = new MessageModel({ip: ip, body: msg});
    message.save(function(err, msg) {
      if (err) console.error(err);
      else console.log('Message successfully saved');
    });
    io.emit('chat message', msg, name);
  });
  socket.on('disconnect', function() {
    ConnectionModel.findOneAndUpdate({ip: ip}, {$push: {connections: {date: Date.now(), event: 'disconnected'}}}, {upsert: true}).then(function(result){
      console.log(result);
    }).catch(function(err){
      console.error(err);
    });
    console.log('user disconnected', socket.client.conn.remoteAddress);
  });
});


mongoPromise.then(function () {
  http.listen(3000, function(){
    console.log('listening on *:3000');
  });
}).catch(function(err) {
  console.error(err);
});
