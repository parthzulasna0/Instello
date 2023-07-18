const mongoose = require('mongoose');

const loginSchema = new mongoose.Schema({
        firstname :{type:String},
        lastname :{type:String},
        email:{type:String,},
        aboutme:{type:String},
        location:{type:String},
        workingat:{type:String},
        relationship:{type:String},
        accountStatus:{type:String, default:'0'},
        password:{type:String},
        token:{type:String, default: '123' },
        profile_pic :{type:String, default:'/profile_pic.png'},
        get_request:{type:Array},
        send_request:{type:Array},
        followers:{type:Array},
        following :{type:Array}
  });

  const loginModel = mongoose.model('loginuser', loginSchema);
  
module.exports = loginModel;