var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var MessageSchema = new Schema({
  ip: { type: String, default: '0.0.0.0' },
  body: { type: String },
  date: { type: Date, default: Date.now },
});
var ConnectionSchema = new Schema({
  ip: {type: String, default: '0.0.0.0'},
  connections: [{date: Date, event: String}],
});
var messageModel = mongoose.model('message', MessageSchema);

var connectionModel = mongoose.model('connection', ConnectionSchema);

module.exports.MessageModel = messageModel;
module.exports.ConnectionModel = connectionModel;
