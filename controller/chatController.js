const chatModel = require('../model/chatModel')
const loginModel = require('../model/loginModel');
const storage = require('node-persist');


exports.addChat = async(req,res) => {
    var id = req.params.id;
    console.log(id);
    var chats = req.body.chats;
    await storage.init();
    var uid = await storage.getItem('userid');
    var sender = await loginModel.findOne({_id:uid});
    var reciver = await loginModel.findOne({_id:id});
   var obj = {
    "sender_id" :sender._id,
    "sender_name" :sender.firstname + " " + sender.lastname,
    "sender_profilepic":sender.profile_pic,
    "reciever_id": reciver._id,
    "reciever_name": reciver.firstname + " " + reciver.lastname,
    "reciever_profilepic":reciver.profile_pic,
    "msg":chats,
    }
    var data = await chatModel.create(obj);
    res.redirect('/chat?chat_id=' + id);
}
