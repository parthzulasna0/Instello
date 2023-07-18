const mongoose = require('mongoose');

const commentsSchema = new mongoose.Schema({
        post_id :{type:String},
        postuser_id :{type:String},
        commentsuser_id:{type:String},
        commentsuserthumbnail : {type:String},
        comments:{type:String},
  });

  const commentsModel = mongoose.model('usercomments', commentsSchema);
  
module.exports = commentsModel;