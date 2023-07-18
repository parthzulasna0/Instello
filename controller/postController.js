const loginModel = require('../model/loginModel');
const postModel = require('../model/postModel');
const  storage  = require('node-persist');

exports.upload_post = async (req,res) => {
  
  await storage.init();
  console.log('iiiii')
  var user_id = await storage.getItem('userid');
  var file = req.file.originalname;
  var user_detail = await loginModel.findById(user_id)
  var obj = {
    "userID":user_id,
    "userName":user_detail.firstname + " "+ user_detail.lastname,
    "thumbnail":user_detail.profile_pic,
    "image":file
    
  }

  var data = await postModel.create(obj);
  res.redirect('/feed')
   
}