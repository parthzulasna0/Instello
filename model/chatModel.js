const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
        sender_id :{type:String},
        sender_name:{type:String},
        sender_profilepic:{type:String},
        reciever_id :{type:String},
        reciever_name : {type:String},
        reciever_profilepic:{type:String},
        msg:{type:String},
  });

  const chatModel = mongoose.model('chat', chatSchema);
  
module.exports = chatModel;