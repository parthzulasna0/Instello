const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
        userID :{type:String},
        userName:{type:String},
        thumbnail:{type:String},
        image :{type:String},
        likes:{type:Array},
        totalLike:{type:Number , default:0},
        totalComments:{type:Number , default:0},
        lastLike:{type:String},
        comments:{type:Array},
        share:{type:Array},
        addfavorite:{type:Array}
  });

  const postModel = mongoose.model('userPost', postSchema);
module.exports = postModel;