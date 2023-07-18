var express = require('express');
var router = express.Router();
const multer = require('multer');
var {register,Login,Registers,LoginQuery,Feed, profile, profile_picPost, explore, chats, trendings, settings, logout, send_request, accept_request, delete_request, likepost,  Search_feed, followers_list, following_list, watch_profile, newregister, unfollow_following, remove_follower, removepost, settingform} = require('../controller/loginController')
 var { upload_post } = require ('../controller/postController');
const { addComments } = require('../controller/commentsController');
const { addChat } = require('../controller/chatController');

/* GET home page. */
router.get('/',Login);
router.post('/',LoginQuery)

router.get('/register',Registers)
router.post('/register', register )

// ===================== Feed page ================
router.get('/feed',Feed)

router.post('/search-feed', Search_feed);

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

var upload = multer({ storage: storage })

router.post('/feed',upload.single('myFile'),upload_post)

// =========================== Feed page end ===================

router.get('/profile', profile)

var storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

var upload_profile = multer({ storage: storage1 })

router.post('/profile', upload_profile.single('myFile1'),profile_picPost)

router.get('/explore', explore)

router.get('/chat', chats)

router.get('/trending', trendings)

router.get('/setting',settings)

router.post('/setting',settingform)

router.get('/logout', logout)

router.get('/send_request/:id', send_request)

router.get('/accept_request/:id', accept_request)

router.get('/delete_request/:id', delete_request)

router.get('/remove_follower/:id', remove_follower)

router.get('/unfollow_following/:id', unfollow_following)

router.get('/like_post/:id', likepost)

router.post('/postcomment/:id', addComments)

router.post('/postchat/:id', addChat)

router.post('/search', Search_feed)

router.get('/followers', followers_list)

router.get('/following',following_list )

router.get('/watch_profile/:id', watch_profile)

router.get('/newregister', newregister)

router.get('/remove_post/:id', removepost)

module.exports = router;
