const commentsModel = require('../model/commentsModel');
const loginModel = require('../model/loginModel');
const postModel = require('../model/postModel');
const  storage  = require('node-persist');

exports.addComments = async(req,res) => {
    var id = req.params.id;
    var comment = req.body.comment;
    await storage.init();
    var uid = await storage.getItem('userid');
    var postuser = await postModel.findOne({_id:id})
    var commnentsuser = await loginModel.findOne({_id:uid})
   var obj = {
    "post_id" :id,
    "postuser_id" :postuser.userID,
    "commentsuser_id": uid,
    "commentsuserthumbnail": commnentsuser.profile_pic,
    "comments":comment,
    }
    var data = await commentsModel.create(obj);
   var  data1= await postModel.findByIdAndUpdate(
        id,
        { $push: { comments: comment } },
        { new: true }
      );
      data1.totalComments = data1.comments.length;
      data1.save();
    res.redirect('/feed')
}