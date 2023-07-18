const loginModel = require('../model/loginModel');
const storage = require('node-persist');
var jwt = require('jsonwebtoken');
const postModel = require('../model/postModel');
const commentsModel = require('../model/commentsModel');
const chatModel = require('../model/chatModel');

exports.Login = async (req, res) => {
  await storage.init();
  const uid = await storage.getItem('userid');

  if(!uid){
    res.render('login')
  }
  else
  {
    res.redirect('/feed')
  }
}

exports.Registers = async (req, res) => {
  await storage.init();
  const uid = await storage.getItem('userid');

  if(!uid){
    res.render('register')
  }
  else
  {
    res.redirect('/feed')
  }
}

exports.register = async (req, res) => {
  try {

    var password = req.body.password;
    var password1 = req.body.password1;
    var email = req.body.email;
    var alldata = await loginModel.find();

    if (password === password1) {
      var emailexist = alldata.some((data) => data.email === email)
      if (!emailexist) {

        var data = await loginModel.create(req.body);
        if (data != null) {
          res.redirect('/');
        }
      }
      else {
        res.status(400).json({
          status: "Email allready Exist.",

        })
      }
    }
    else {
      res.status(400).json({
        status: "Password not Match",

      })
    }
  }
  catch (error) {
    res.status(200).json({
      status: "error",
      error: error.message
    })
  }
}

exports.LoginQuery = async (req, res) => {

  var email = req.body.email
  var password = req.body.password;

  try {
    if (!email || !password) {
      res.status(200).json({
        status: "Field must be mendetary.",
        error: error.message
      })

    }
    else {
      var data = await loginModel.find({ "email": email })
      if (data != null) {
        if (password === data[0].password) {
          var token = jwt.sign({ id: data[0].id }, "kiranApi")
          await storage.init();
          await storage.setItem('userid', data[0].id);
          var obj = {
            "token": token,
            "__v": 1
          }

          var dataupdate = await loginModel.findByIdAndUpdate(data[0].id, obj);
          await storage.setItem('usertoken', data[0].token);
          var tokenG = await storage.getItem('usertoken')

          console.log(data[0].token);
          console.log(tokenG);
          if (data[0].token === tokenG) {
            res.redirect('/feed')
          }
          else {
            res.status(400).json({
              status: "token not match",
              error: error.message
            })
          }
        }
        else {
          res.status(400).json({
            status: "Password not match",
            error: error.message
          })

        }
      }
      else {
        res.status(200).json({
          status: "email not found",
          error: error.message
        })

      }
    }
  }
  catch (error) {
    res.status(400).json({
      status: "error",
      error: error.message
    })
  }
}

exports.Feed = async (req, res) => {
  await storage.init();
  const uid = await storage.getItem('userid');
  
  if(uid) {

    // ==================== send resqusted, delete from new Registration===========================
    
    var data = await loginModel.findOne({ _id: uid })
    var datap = await loginModel.find({ accountStatus:1  })
    console.log(datap);
    var send_request_ids = await loginModel.find({ _id: uid }, { send_request: 1 });
    var send_requests = send_request_ids.length > 0 ? send_request_ids[0].send_request : [];
    var following_ids = await loginModel.find({_id:uid},{following:1});
    var following = following_ids.length > 0 ? following_ids[0].following : [];
    var followers_ids = await loginModel.find({_id:uid},{followers:1});
    var followers = followers_ids.length > 0 ? followers_ids[0].followers : [];
    var sended = [uid, ...send_requests, ...following, ...followers ];
    var sended_back = [...followers];
    var not_sended_back = [uid, ...following,];

    // ======================= get request =============================
    var get_request_ids = await loginModel.find({ _id: { $in: data.get_request } })
    // ======================= for find Last 4 new user ===========================
    var newRegister = await loginModel.find({ _id: { $nin: sended } }).sort({ _id: -1 }).limit(3);
    var followback = await loginModel.find({ _id: { $in: sended_back, $nin: not_sended_back } }).sort({ _id: -1 }).limit(4);
    // ======================= for find Latest 4 post ===========================
    var newpost = await postModel.find({ $or: [{ userID: uid }, { userID: { $in: data.followers } } , { userID: datap._id }] }).sort({ _id: -1 }).limit(4);
    var total_post = await postModel.countDocuments({ userID: uid });
    // ==========================All Post =============================================
     var postdata = await postModel.find({ $or: [{ userID: uid }, { userID: { $in: data.followers } }, { userID: datap._id } ] }).sort({ _id: -1 });
    // ===================== total Notification =======================================
    var total_followers = data.followers.length;
    var total_following = data.following.length;
    var total_notification = get_request_ids.length;

    // ===================== get last 2 comments ==============================
    var last2comments = {};
        for (let item of postdata) {
          const comments = await commentsModel.find({ post_id: item._id }).sort({ _id: -1 }).limit(2);
          last2comments[item._id] = comments
        }

    var last3Like = {};
        for (let item of postdata) {
          const Likes = await loginModel.find({ _id: { $in: item.likes } }).sort({ _id: -1 }).limit(3);
          last3Like[item._id] = Likes
        }

// ============================ messaes of topbar ================

var newMessages = await chatModel.aggregate([
  {
    $match: { reciever_id: uid }
  },
  {
    $sort: { _id: -1 }
  },
  {
    $group: {
      _id: "$sender_id",
      lastMessage: { $first: "$$ROOT" }
    }
  },
  {
    $replaceRoot: { newRoot: "$lastMessage" }
  },
  {
    $limit: 5
  }
]);

var total_messages = newMessages.length;

    res.render('feed', {data: data,
      last3Like:last3Like,
      last2comments:last2comments,
      newMessages:newMessages,
      total_messages:total_messages,
      uid: uid,
      followback:followback,
      total_following: total_following,
      total_notification: total_notification,
      get_request_ids: get_request_ids,
      total_followers: total_followers,
      total_post: total_post,
      post: postdata,
      newRegister: newRegister,
      newpost: newpost
    });
  }
  else {    
    res.redirect('/')
  }

}

exports.profile = async (req, res) => {
  await storage.init();
  const uid = await storage.getItem('userid');
  if(uid){
    var data = await loginModel.findOne({ _id: uid })
    var post_img = await postModel.find({ "userID": uid });
  
    // ======================= get request =============================
    var get_request_ids = await loginModel.find({ _id: { $in: data.get_request } })
  
    // ======================= for find Latest 4 post ===========================
    var total_post = await postModel.countDocuments({ userID: uid });
    // ===================== total Notification =======================================
    var total_followers = data.followers.length;
    var total_following = data.following.length;
    var total_notification = get_request_ids.length;

    var newMessages = await chatModel.aggregate([
      {
        $match: { reciever_id: uid }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $group: {
          _id: "$sender_id",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$lastMessage" }
      },
      {
        $limit: 5
      }
    ]);
    
    var postdata = await postModel.find({ $or: [{ userID: uid }, { userID: { $in: data.followers } }] }).sort({ _id: -1 });

    // ===================== get last 2 comments ==============================
    var last2comments = {};
        for (let item of postdata) {
          const comments = await commentsModel.find({ post_id: item._id }).sort({ _id: -1 }).limit(2);
          last2comments[item._id] = comments
        }
   

    var total_messages = newMessages.length;
    res.render('profile', {total_messages:total_messages,
      last2comments:last2comments,
      total_following: total_following,
      newMessages:newMessages,
      total_notification: total_notification,
      get_request_ids: get_request_ids,
      total_followers: total_followers,
      total_post: total_post,
      data: data,
      post_img: post_img,
    });
  
  }
  else {    
    res.redirect('/')
  }

  
}

exports.profile_picPost = async (req, res) => {

  await storage.init();

  const uid = await storage.getItem('userid');
  if(uid){
    var file1 = req.file.originalname;
    await loginModel.findByIdAndUpdate(uid, { profile_pic: file1 });
    var userposts = await postModel.find({ userID: uid });
    var userchat = await chatModel.find({ sender_id: uid });
    var r_cat = await chatModel.find({reciever_id: uid})
    
    
    for (let i = 0; i < userposts.length; i++) {
      const post = userposts[i];
      post.thumbnail = file1;
      await post.save();
    }
    
    for (let i = 0; i < userchat.length; i++) {
      const chat = userchat[i];
      chat.sender_profilepic = file1;
      await chat.save();
    }
    
    for (let i = 0; i < r_cat.length; i++) {
      const chat1 = r_cat[i];
      chat1.reciever_profilepic = file1;
      await chat1.save();
    }

    res.redirect('/profile');
  } else {    
    res.redirect('/')
  }
 
}

// ==================== Explore page ================
exports.explore = async (req, res) => {
  await storage.init();
  const uid = await storage.getItem('userid');
  if(uid){
    var data = await loginModel.findOne({ _id: uid })
    var post_img = await postModel.find({ "userID": uid });
    var total_post = await postModel.countDocuments({ userID: uid });
    var all_post = await postModel.find({ $or: [{ userID: uid }, { userID: { $in: data.followers } }] });
    // ======================= get request =============================
    var get_request_ids = await loginModel.find({ _id: { $in: data.get_request } })
  
    // ======================= for find Latest 4 post ===========================
  
    var total_post = await postModel.countDocuments({ userID: uid });
    // ===================== total Notification =======================================
    var total_followers = data.followers.length;
    var total_following = data.following.length;
    var total_notification = get_request_ids.length;

    var postdata = await postModel.find({ $or: [{ userID: uid }, { userID: { $in: data.followers } }] }).sort({ _id: -1 });

    // ===================== get last 2 comments ==============================
    var last2comments = {};
        for (let item of postdata) {
          const comments = await commentsModel.find({ post_id: item._id }).sort({ _id: -1 }).limit(2);
          last2comments[item._id] = comments
        }
   

    var newMessages = await chatModel.aggregate([
      {
        $match: { reciever_id: uid }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $group: {
          _id: "$sender_id",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$lastMessage" }
      },
      {
        $limit: 5
      }
    ]);
    
    var total_messages = newMessages.length;

    res.render('explore', {total_messages:total_messages,
      last2comments:last2comments,
      newMessages:newMessages,
      total_following: total_following,
      total_notification: total_notification,
      get_request_ids: get_request_ids,
      total_followers: total_followers,
      total_post: total_post,
      data: data,
      total_post: total_post
      , post_img: post_img,
      all_post: all_post
    });
  }
  else {    
    res.redirect('/')
  }

  
 
}

// ==================== Chat page ================
exports.chats = async (req, res) => {

  var chat_id = req.query.chat_id;
  await storage.init();
    const uid = await storage.getItem('userid');

    if(uid){

      if (chat_id) {
        var data = await loginModel.findOne({ _id: uid })
        var r_data = await loginModel.findOne({ _id: chat_id })
        var chatData = await chatModel.find({ $or: [{ sender_id: uid, reciever_id: chat_id }, { reciever_id: uid, sender_id: chat_id }] });
      console.log(chatData)
      }
    
      var data = await loginModel.findOne({ _id: uid });
      var data1 = await loginModel.find({ _id: { $nin: uid } });
      var post_img = await postModel.find({ "userID": uid });
      var total_post = await postModel.countDocuments({ userID: uid });

      // ======================= get request =============================
      var get_request_ids = await loginModel.find({ _id: { $in: data.get_request } })
      // ======================= Total Post ===========================
    
      var total_post = await postModel.countDocuments({ userID: uid });

      // ===================== total Notification =======================================

      var total_followers = data.followers.length;
      var total_following = data.following.length;
      var total_notification = get_request_ids.length;
      var newMessages = await chatModel.aggregate([
        {
          $match: { reciever_id: uid }
        },
        {
          $sort: { _id: -1 }
        },
        {
          $group: {
            _id: "$sender_id",
            lastMessage: { $first: "$$ROOT" }
          }
        },
        {
          $replaceRoot: { newRoot: "$lastMessage" }
        },
        {
          $limit: 5
        }
      ]);
      
      var total_messages = newMessages.length;

      res.render('chat', {total_messages,total_messages,
        data1: data1,
        get_request_ids: get_request_ids,
        total_following: total_following,
        total_notification: total_notification,
        total_followers: total_followers,
        total_post: total_post,
        data: data,
        total_post: total_post,
        post_img: post_img,
        r_data: r_data,
        chatData: chatData,
        newMessages:newMessages,
      });
    
    }
    else {    
      res.redirect('/')
    }
 
}

// ==================== Trending page ================
exports.trendings = async (req, res) => {
  await storage.init();
  const uid = await storage.getItem('userid');
  if(uid){
    var data = await loginModel.findOne({ _id: uid })
    var post_img = await postModel.find({ "userID": uid });
    var total_post = await postModel.countDocuments({ userID: uid });
    var all_post = await postModel.find({ $or: [{ userID: uid }, { userID: { $in: data.followers } }] });
  // ============================ Sueion ===================
  var send_request_ids = await loginModel.find({ _id: uid }, { send_request: 1 });
  var send_requests = send_request_ids.length > 0 ? send_request_ids[0].send_request : [];
  var following_ids = await loginModel.find({_id:uid},{following:1});
  var following = following_ids.length > 0 ? following_ids[0].following : [];
  var followers_ids = await loginModel.find({_id:uid},{followers:1});
  var followers = followers_ids.length > 0 ? followers_ids[0].followers : [];
  var sended = [uid, ...send_requests, ...following, ...followers ];
  var newRegister = await loginModel.find({ _id: { $nin: sended } }).sort({ _id: -1 }).limit(5);
 
    // ======================= get request =============================
    var get_request_ids = await loginModel.find({ _id: { $in: data.get_request } })
  
    // ======================= Total Post ===========================
  
    var total_post = await postModel.countDocuments({ userID: uid });
    // ===================== total Notification =======================================
    var total_followers = data.followers.length;
    var total_following = data.following.length;
    var total_notification = get_request_ids.length;
    
    var newMessages = await chatModel.aggregate([
      {
        $match: { reciever_id: uid }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $group: {
          _id: "$sender_id",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$lastMessage" }
      },
      {
        $limit: 5
      }
    ]);
    
    var total_messages = newMessages.length;
  var postdata = await postModel.find({ $or: [{ userID: uid }, { userID: { $in: data.followers } }] }).sort({ _id: -1 });
  var last2comments = {};
  for (let item of postdata) {
    const comments = await commentsModel.find({ post_id: item._id }).sort({ _id: -1 }).limit(2);
    last2comments[item._id] = comments
  }
  res.render('trending', {newMessages:newMessages, 
    last2comments:last2comments,
      total_messages:total_messages,
      total_following: total_following,
      total_notification: total_notification,
      get_request_ids: get_request_ids,
      total_followers: total_followers,
      total_post: total_post,
      data: data,
      total_post: total_post,
      post_img: post_img, all_post: all_post,
      newRegister: newRegister
    });
  }
  else {    
    res.redirect('/')
  }
}

// ==================== Setting page ================                          
exports.settings = async (req, res) => {
  await storage.init();
  const uid = await storage.getItem('userid');
  if(uid){
    var data = await loginModel.findOne({ _id: uid })
    var post_img = await postModel.find({ "userID": uid });
    var total_post = await postModel.countDocuments({ userID: uid });
    var all_post = await postModel.find({ $or: [{ userID: uid }, { userID: { $in: data.followers } }] });
    var newRegister = await loginModel.find().sort({ _id: -1 });
    // ======================= get request =============================
    var get_request_ids = await loginModel.find({ _id: { $in: data.get_request } })
  
    // ======================= Total Post ===========================
  
    var total_post = await postModel.countDocuments({ userID: uid });
    // ===================== total Notification =======================================
    var total_followers = data.followers.length;
    var total_following = data.following.length;
    var total_notification = get_request_ids.length;
    var newMessages = await chatModel.aggregate([
      {
        $match: { reciever_id: uid }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $group: {
          _id: "$sender_id",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$lastMessage" }
      },
      {
        $limit: 5
      }
    ]);
    
    var total_messages = newMessages.length;


    res.render('setting', {newMessages:newMessages,
      total_messages:total_messages,
      total_following: total_following,
      total_notification: total_notification,
      get_request_ids: get_request_ids,
      total_followers: total_followers,
      total_post: total_post,
      data: data,
      total_post: total_post,
      post_img: post_img,
      all_post: all_post,
      newRegister: newRegister
    });
  }  else {    
    res.redirect('/')
  }
}

// ================== Send Request (ok)=================

exports.send_request = async (req, res) => {
  try {
    const id = req.params.id;
    await storage.init();
    var uid = await storage.getItem('userid');
    if(uid){
     await loginModel.findOneAndUpdate(
        { _id: uid },
        { $push: { send_request: id } },
        { new: true }
      );
     await loginModel.findByIdAndUpdate(
      { _id: id }, 
      { $push: { get_request: uid } },
       { new: true });
  
      res.redirect('/feed');
    }
   else{
    res.redirect('/')
   }

  } catch (error) {
    // Handle the error
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
};

// ================== Accept Request (ok)=================
exports.accept_request = async (req, res) => {
  try {
    const id = req.params.id;
    await storage.init();
    var uid = await storage.getItem('userid');
  
    // Remove id from the send_request array of the logged-in user
     await loginModel.findByIdAndUpdate(
      id,
      { $pull: { send_request: uid } },
      { new: true }
    );

    // Remove uid from the get_request array of the user being accepted
    await loginModel.findByIdAndUpdate(
      uid,
      { $pull: { get_request: id } },
      { new: true }
    );  

    // Add id to the followers array of the logged-in user
    await loginModel.findByIdAndUpdate(
      uid,
      { $push: { followers: id } },
      { new: true }
    );

    // Add uid to the following array of the user being accepted
    await loginModel.findByIdAndUpdate(
      id,
      { $push: { following: uid } },
      { new: true }
    );

    res.redirect('/feed');
  } catch (error) {
    // Handle the error
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
};

// ============================== delete Request (ok) ===================
exports.delete_request = async (req, res) => {
  try {
    const id = req.params.id;
    await storage.init();
    var uid = await storage.getItem('userid');

    // Remove id from the send_request array of the logged-in user
 await loginModel.findByIdAndUpdate(
      id,
      { $pull: { send_request: uid } },
      { new: true }
    );

    // Remove uid from the get_request array of the user being accepted
await loginModel.findByIdAndUpdate(
      uid,
      { $pull: { get_request: id } },
      { new: true }
    );


    res.redirect('/feed');
  } catch (error) {
    // Handle the error
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
}

// ========================= Add post like in like Array =================

exports.likepost = async (req, res) => {
  try {
    const post_id = req.params.id;
    await storage.init();
    var uid = await storage.getItem('userid');
    const post = await postModel.findById(post_id);
    const getLastlike = await loginModel.findById(uid)
    if (post) {
      var get_id = post.likes.includes(uid)
    }
    if (!get_id) {
      await postModel.findOneAndUpdate(
        { _id: post_id },
        { $push: { likes: uid }, $set: { lastLike: getLastlike.firstname + " " + getLastlike.lastname } },
        { new: true }
      )
      post.totalLike = post.likes ? post.likes.length + 1 : 0;

    } else {
      await postModel.findOneAndUpdate(
        { _id: post_id },
        { $pull: { likes: uid } },
        { new: true }
      );
      post.totalLike = post.likes.length - 1;
    }
    await post.save();

    res.redirect('/feed');

  } catch (error) {
    // Handle the error
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
};

// ======================== search =================

exports.Search_feed = async (req, res) => {
  await storage.init();
  const uid = await storage.getItem('userid');
  if(uid){
    const searchValue = req.body.search;
    const regex = new RegExp(searchValue, "i");
    const searchResult = await loginModel.find({ _id: { $ne: uid }, firstname: { $regex: regex } });
  
    var data = await loginModel.findOne({ _id: uid });
    var data1 = await loginModel.find({ _id: { $ne: uid } });
    var post_img = await postModel.find({ "userID": uid });
    var total_post = await postModel.countDocuments({ userID: uid });
  
    // ======================= get request =============================
    var get_request_ids = await loginModel.find({ _id: { $in: data.get_request } })
    // ======================= Total Post ===========================
  
    var total_post = await postModel.countDocuments({ userID: uid });
    // ===================== total Notification =======================================
    var total_followers = data.followers.length;
    var total_following = data.following.length;
    var total_notification = get_request_ids.length;
  
    
    var newMessages = await chatModel.aggregate([
      {
        $match: { reciever_id: uid }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $group: {
          _id: "$sender_id",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$lastMessage" }
      },
      {
        $limit: 5
      }
    ]);
    
    var total_messages = newMessages.length;

    res.render('search', {
      searchResult: searchResult, data1: data1,
      newMessages:newMessages,
      total_messages:total_messages,
      get_request_ids: get_request_ids,
      total_following: total_following,
      total_notification: total_notification,
      total_followers: total_followers,
      total_post: total_post,
      data: data,
      post_img: post_img,
    });
  }
  else {    
    res.redirect('/')
  }
}

exports.followers_list = async (req, res) => {
  await storage.init();
  const uid = await storage.getItem('userid');
if(uid){
  var data = await loginModel.findOne({ _id: uid });
  const followerIds = data.followers;
  var data1 = await loginModel.find({ _id: { $in: followerIds } });
  var post_img = await postModel.find({ "userID": uid });
  var total_post = await postModel.countDocuments({ userID: uid });

  // ======================= get request =============================
  var get_request_ids = await loginModel.find({ _id: { $in: data.get_request } })
  // ======================= Total Post ===========================

  var total_post = await postModel.countDocuments({ userID: uid });
  // ===================== total Notification =======================================
  var total_followers = data.followers.length;
  var total_following = data.following.length;
  var total_notification = get_request_ids.length;
  var newMessages = await chatModel.aggregate([
    {
      $match: { reciever_id: uid }
    },
    {
      $sort: { _id: -1 }
    },
    {
      $group: {
        _id: "$sender_id",
        lastMessage: { $first: "$$ROOT" }
      }
    },
    {
      $replaceRoot: { newRoot: "$lastMessage" }
    },
    {
      $limit: 5
    }
  ]);
  
  var total_messages = newMessages.length;
  res.render('followerlist', {newMessages:newMessages,
    total_messages:total_messages,
    data1: data1,
    get_request_ids: get_request_ids,
    total_following: total_following,
    total_notification: total_notification,
    total_followers: total_followers,
    total_post: total_post,
    data: data,
    post_img: post_img,
  });
} else {    
    res.redirect('/')
  }
 
}

exports.following_list = async (req, res) => {
  await storage.init();
  const uid = await storage.getItem('userid');
if(uid){
  var data = await loginModel.findOne({ _id: uid });
  const followingIds = data.following;
  var data1 = await loginModel.find({ _id: { $in: followingIds } });
  var post_img = await postModel.find({ "userID": uid });
  var total_post = await postModel.countDocuments({ userID: uid });

  // ======================= get request =============================
  var get_request_ids = await loginModel.find({ _id: { $in: data.get_request } })
  // ======================= Total Post ===========================

  var total_post = await postModel.countDocuments({ userID: uid });
  // ===================== total Notification =======================================
  var total_followers = data.followers.length;
  var total_following = data.following.length;
  var total_notification = get_request_ids.length;
  var newMessages = await chatModel.aggregate([
    {
      $match: { reciever_id: uid }
    },
    {
      $sort: { _id: -1 }
    },
    {
      $group: {
        _id: "$sender_id",
        lastMessage: { $first: "$$ROOT" }
      }
    },
    {
      $replaceRoot: { newRoot: "$lastMessage" }
    },
    {
      $limit: 5
    }
  ]);
  
  var total_messages = newMessages.length;
  res.render('followinglist', {newMessages:newMessages,
    total_messages:total_messages,
    data1: data1,
    get_request_ids: get_request_ids,
    total_following: total_following,
    total_notification: total_notification,
    total_followers: total_followers,
    total_post: total_post,
    data: data,
    post_img: post_img,
  });
}else {    
    res.redirect('/')
  }
 
}

exports.watch_profile = async (req, res) => {
  var id = req.params.id;
  await storage.init();
  var uid = await storage.getItem('userid');

  if(uid)
  {
    var data = await loginModel.findOne({ _id: uid })
    var post_img = await postModel.find({ "userID": id });
    // ======================= get request =============================
    var get_request_ids = await loginModel.find({ _id: { $in: data.get_request } })
    var total_post = await postModel.countDocuments({ userID: uid });
    // ===================== total Notification =======================================
    var total_followers = data.followers.length;
    var total_following = data.following.length;
    var total_notification = get_request_ids.length;
  
    var data1 = await loginModel.findOne({ _id: id })

    var total_followers1 = data1.followers.length;
    var total_following1 = data1.following.length;
    var total_post1 = await postModel.countDocuments({ userID: id });

    var send_request_ids = await loginModel.find({ _id: uid }, { send_request: 1 });
    var send_requests = send_request_ids.length > 0 ? send_request_ids[0].send_request : [];
    var get_request_ids1 = await loginModel.find({ _id: uid }, { get_request: 1 });
    var get_requests = get_request_ids1.length > 0 ? get_request_ids1[0].get_request : [];
    var followers_ids = await loginModel.find({ _id: uid }, { followers: 1 });
    var followers = followers_ids.length > 0 ? followers_ids[0].followers : [];
    var following_ids = await loginModel.find({ _id: uid }, { following: 1 });
    var following = following_ids.length > 0 ? following_ids[0].following : [];
  
    var status;
    for(let i=0; i < send_requests.length; i++)
    {
      if(send_requests[i] === id)
      {
       status = 'Requested';
      }
     
    }
   
      for(let i=0; i < get_requests.length; i++)
      {
        if(get_requests[i] === id)
        {
         status = 'Accept Request';
        }
      }
        
      for(let i=0; i < followers.length; i++)
      {
        if(followers[i] === id)
        {
         status = 'Remove';
        }
      }
         
      for(let i=0; i < following.length; i++)
      {
        if(following[i] === id)
        {
         status = 'Unfollow';
        }
      }
      var newMessages = await chatModel.aggregate([
        {
          $match: { reciever_id: uid }
        },
        {
          $sort: { _id: -1 }
        },
        {
          $group: {
            _id: "$sender_id",
            lastMessage: { $first: "$$ROOT" }
          }
        },
        {
          $replaceRoot: { newRoot: "$lastMessage" }
        },
        {
          $limit: 5
        }
      ]);
      
      var total_messages = newMessages.length;

    res.render('userprofile', {newMessages:newMessages,
      total_messages:total_messages,
           status:status,
      total_following: total_following,
      total_notification: total_notification,
      get_request_ids: get_request_ids,
      total_followers: total_followers,
      total_post: total_post,
      data: data,
      data1: data1,
      post_img: post_img,
      total_followers1: total_followers1,
      total_following1: total_following1,
      total_post1: total_post1
    });
  }
  else {    
    res.redirect('/')
  }
}

exports.newregister = async (req, res) => {

  await storage.init();
  const uid = await storage.getItem('userid');
  if(uid){
    var data = await loginModel.findOne({ _id: uid })

  // =================================================================
  // =================================================================
  var send_request_ids = await loginModel.find({ _id: uid }, { send_request: 1 });
  var send_requests = send_request_ids.length > 0 ? send_request_ids[0].send_request : [];
  var following_ids = await loginModel.find({_id:uid},{following:1});
  var following = following_ids.length > 0 ? following_ids[0].following : [];
  var followers_ids = await loginModel.find({_id:uid},{followers:1});
  var followers = followers_ids.length > 0 ? followers_ids[0].followers : [];
  var sended = [uid, ...send_requests, ...following, ...followers ];
  var sended_back = [...followers];
  var not_sended_back = [uid, ...following,];
  // ======================= for find Last 4 new user ===========================
  var newUser = await loginModel.find({ _id: { $nin: sended } }).sort({ _id: -1 }).limit(4);
  var followback = await loginModel.find({ _id: { $in: sended_back, $nin: not_sended_back } }).sort({ _id: -1 }).limit(4);
  // =================================================================
  // =================================================================

    var data = await loginModel.findOne({ _id: uid });
    var data1 = await loginModel.find({ _id: { $ne: uid } });
    var post_img = await postModel.find({ "userID": uid });
    var total_post = await postModel.countDocuments({ userID: uid });
  
    // ======================= get request =============================
    var get_request_ids = await loginModel.find({ _id: { $in: data.get_request } })
    // ======================= Total Post ===========================
  
    var total_post = await postModel.countDocuments({ userID: uid });
    // ===================== total Notification =======================================
    var total_followers = data.followers.length;
    var total_following = data.following.length;
    var total_notification = get_request_ids.length;
    var newMessages = await chatModel.aggregate([
      {
        $match: { reciever_id: uid }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $group: {
          _id: "$sender_id",
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$lastMessage" }
      },
      {
        $limit: 5
      }
    ]);
    
    var total_messages = newMessages.length;

    res.render('newuser', {newMessages:newMessages,
      total_messages:total_messages,
      followback: followback,
      newUser: newUser,
      data1: data1,
      get_request_ids: get_request_ids,
      total_following: total_following,
      total_notification: total_notification,
      total_followers: total_followers,
      total_post: total_post,
      data: data,
      post_img: post_img
    });
  } else {    
    res.redirect('/')
  }
 
}

// ======================== remove followers (ok) ==================
exports.remove_follower = async (req, res) => {
  try {
  
    const id = req.params.id;
    await storage.init();
    var uid = await storage.getItem('userid');

    // Remove id from the following array of the perticuler id
      await loginModel.findByIdAndUpdate(
      id,
      { $pull: { following: uid } },
      { new: true }
    );

  
    // Remove id from the send_request array of the logged-in user
    await loginModel.findByIdAndUpdate(
      uid,
      { $pull: { followers: id } },
      { new: true }
    );


    res.redirect('/followers');
  } catch (error) {
    // Handle the error
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
}

// ======================== unfollow following (ok)==================
exports.unfollow_following = async (req, res) => {
  try {
  
    const id = req.params.id;
    await storage.init();
    var uid = await storage.getItem('userid');

    // Remove id from the following array of the perticuler id
      await loginModel.findByIdAndUpdate(
      id,
      { $pull: { followers: uid } },
      { new: true }
    );

  
    // Remove id from the send_request array of the logged-in user
    await loginModel.findByIdAndUpdate(
      uid,
      { $pull: { following: id } },
      { new: true }
    );


    res.redirect('/following');
  } catch (error) {
    // Handle the error
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
}

// ========================= Remove Post ========================
exports.removepost = async (req,res) => {
  var id = req.params.id;
  await postModel.findByIdAndDelete(id);
  res.redirect('/profile');
}

// ========================= Settin form =======================
exports.settingform = async (req,res) => {
  await storage.init();
  var uid = await storage.getItem('userid');

  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var email = req.body.email;
  var aboutme = req.body.aboutme;
  var location = req.body.location;
  var work = req.body.work;
  var relationship = req.body.relationship;
  var acstatus = req.body.acstatus
  var obj = {
    "firstname": firstname,
    "lastname": lastname,
    "email": email,
    "aboutme": aboutme,
    "location": location,
    "workingat": work,
    "relationship": relationship,
    "accountStatus": acstatus,
  }
  await loginModel.findByIdAndUpdate(uid, obj); 
  res.redirect('/setting');
}
// ===================== logout ===================

exports.logout = async (req, res) => {

  await storage.init();
  const uid = await storage.getItem('userid');
      var obj = {
        "token": "",
        "__v": 0
      }
      await loginModel.findByIdAndUpdate(uid, obj); 
  await storage.removeItem('userid'); 
  res.redirect('/')
}