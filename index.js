const express = require('express');
const app = express();
const PORT = 3333;
const csrf = require('csurf');
const socket = require("socket.io");
const server = require('http').createServer(app);
const io = socket(server);
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const passport = require('passport');
const User = require('./models/user');
const Chatroom = require('./models/chatroom');
const message = require('./models/message');
const fileUpload = require('express-fileupload');
var loginerror = undefined
var numUsers = 0;
const crypto = require('crypto');

require('dotenv').config()

app.use(require('express-session')({
    secret: process.env.SECRET,
    saveUninitialized: true,
    resave: true
}));

const csrfProtect = csrf({cookie: true})
app.use(passport.initialize());
app.use(passport.session());

// default options
app.use(fileUpload());

// Conenct to DB
mongoose.connect('mongodb://127.0.0.1/encchat');
var db = mongoose.connection;

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use(cookieParser());
app.set('view-engine', 'ejs');
app.use(express.static('static'));
app.set('views', './views');

var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
    function (username, password, done) {
        /* see done being invoked with different paramters
           according to different situations */
        User.getUserByUsername(username, function (err, user) {
            if (err) { return done(err); }
            if (!user) { loginerror = "badUserInput"; return done(null, false); }
            User.comparePassword(password, user.password, function (err, isMatch) {
                if (err) throw err;
                if (!user) { loginerror = "badUserInput"; return done(null, false); }
                if (isMatch) { return done(null, user); } else {
                    loginerror = "badUserInput";
                    return done(null, false, null, 'badUserInput');
                }
            });
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.getUserById(id, function (err, user) {
        done(err, user);
    });
});


function makecode(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.-=';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

app.get('/sitemap.xml', function (req, res) {
    res.sendFile('sitemap.xml')
})

app.get('/', async function (req, res) {
  var roomslist = await Chatroom.find().exec();
  if (roomslist.length == 0) {
    console.log("passed check")
    roomslist = null;
  }
  // console.log("roomslits:",roomslist)
  if (req.isAuthenticated()){
    console.log('loggedin as:',req.user.username)
    res.render('rooms.ejs', {logged: true, username: req.user.username, id: req.user.id, room: req.params.id, rooms: roomslist})
  } else {
      res.render('rooms.ejs', {logged: false, username: "", id: "", room: req.params.id, rooms: roomslist})
  }
})

app.get('/create', csrfProtect, async function (req, res) {
  if (req.isAuthenticated()){
    console.log('loggedin as:',req.user.username)
    res.render('create.ejs', {csrfToken: req.csrfToken(), logged: true, username: req.user.username, id: req.user.id})
  } else {
      res.render('create.ejs', {csrfToken: req.csrfToken(), logged: false, username: "", id: ""})
  }
})

app.post('/create', csrfProtect, async function (req, res) {
  if (req.isAuthenticated()){
    console.log('loggedin as:',req.user.username)
    // var roompass = req.body.roompass;
    // if (req.body.roompass == "") {
    //   roompass = null;
    // }
    var newroom = new Chatroom({
      name: req.body.roomname,
      topic: req.body.topic,
      users: [req.user.username],
      password: req.body.roompass,
    })
    if (newroom.password == ""){
      newroom.save()
    } else {
      Chatroom.createRoom(newroom)
    }
    return res.redirect('/');
    
  } else {
    res.status(403).send("cannot create room as an anonymous user currently")
  }
})

app.get('/join/:id', csrfProtect, async function (req, res) {
  var chatroom = await Chatroom.findById(req.params.id).exec()
  console.log("room join:",chatroom)
  if (chatroom.length != 0){
    if (!chatroom.locked){
      if (chatroom.password != ""){
        if (req.isAuthenticated()){
          console.log("in:",chatroom.users.includes(req.user.username))
          console.log("arr:",req.user.username,chatroom.users)
            if (chatroom.users.includes(req.user.username)){
              return res.redirect(`/waitroom/${req.params.id}`)
            }
            console.log('loggedin as:',req.user.username)
            var error = ""
            if (req.query.e != null || req.query.e != undefined || req.query.e != ""){
              error = decodeURIComponent(req.query.e);
            }
            res.render('join.ejs', {csrfToken: req.csrfToken(), logged: true, username: req.user.username, id: req.user.id, room: req.params.id, error: error} )
        } else {
            var error = ""
            if (req.query.e == null && req.query.e != undefined && req.query.e != ""){
              error = decodeURIComponent(req.query.e);
            }
            res.render('join.ejs', {csrfToken: req.csrfToken(), logged: false, username: "", id: null, room: req.params.id, error: error})
        }
      } else {
        res.redirect(`/chat/${req.params.id}`)
      }
    } else {
      res.status(403).send("Chat room is locked and can now not be joined")
    }
  } else {
    res.status(404).send("Chat room doesnt exist or was expired.")
  }
})

app.post('/join/:id', csrfProtect, async function (req, res) {
  var chatroom = await Chatroom.findById(req.params.id).exec()
  console.log("room join:",chatroom)
  if (chatroom.length != 0){
    if (!chatroom.locked){
      if (chatroom.password != null){
        if (req.isAuthenticated()){
            if (chatroom.users.includes(req.user.username)){
              return res.redirect(`/waitroom/${req.params.id}`)
            }
            Chatroom.comparePassword(req.body.password, chatroom.password, function (err, isMatch) {
              console.log("password is:",isMatch)
              if (err) throw err;
              if (isMatch) {
                // TODO: password is matching but not updating to database
                Chatroom.findOneAndUpdate({_id: req.params.id}, {$push: {users: req.user.username}});
                console.log("user added to room");
                return res.redirect(`/waitroom/${req.params.id}`)
              } else {
                return res.redirect(`/join/${req.params.id}?e=${encodeURIComponent("Incorrect Password please try again")}`)
              }
            })
        } else {
            res.status(403).send("Chat room can not be joined by anonymous users")
        }
      } else {
        res.redirect(`/chat/${req.params.id}`)
      }
    } else {
      res.status(403).send("Chat room is locked and can now not be joined")
    }
  } else {
    res.status(404).send("Chat room doesnt exist or was expired.")
  }
})

app.get('/waitroom/:id', csrfProtect, async function (req, res) {
  var chatroom = await Chatroom.findById(req.params.id).exec()
  if (chatroom.length != 0){
    var userslist = await User.find({username: { $in: chatroom.users}}).exec()
    if (userslist.length == 0) {
      userslist = null;
    }
    console.log(userslist)
    if (req.isAuthenticated()){
        console.log('loggedin as:',req.user.username)
        if (chatroom.users[0] == req.user.username) {
          return res.render('waitroom.ejs', {csrfToken: req.csrfToken(),owner: true, logged: true, username: req.user.username, id: req.user.id, room: req.params.id, users: userslist})
        }
        return res.render('waitroom.ejs', {csrfToken: req.csrfToken(),owner: false, logged: true, username: req.user.username, id: req.user.id, room: req.params.id, users: userslist})
    } else {
        // in future check will be if chatroom.users[0] == req.cookies.username 
        res.render('waitroom.ejs', {csrfToken: req.csrfToken(),owner: false, logged: false, username: "", id: null, room: req.params.id, users: userslist})
    }
  } else {
    res.status(404).send("Chat room doesnt exist or was expired.")
  }
})

app.get('/chat/:id', csrfProtect,async function (req, res) {
  var chatroom = await Chatroom.findById(req.params.id).exec()
  if (chatroom.length != 0){
    if (req.isAuthenticated()){
        console.log('loggedin as:',req.user.username)
        res.render('chat.ejs', {csrfToken: req.csrfToken(), logged: true, username: req.user.username, id: req.user.id, room: req.params.id})
    } else {
        res.render('chat.ejs', {csrfToken: req.csrfToken(), logged: false, username: "", id: null, room: req.params.id})
    }
  } else {
    res.status(404).send("Chat room doesnt exist or was expired.")
  }
})


app.get('/user/:username', csrfProtect, async function(req, res) {
  var user = await User.findOne({username: req.params.username}).exec()
  if (user.length != 0){
    if (req.isAuthenticated()){
      if (req.user.username == req.params.username) {
        return res.render('user.ejs', {csrfToken: req.csrfToken(), owned: true, user: user})
      } else {
        return res.render('user.ejs', {csrfToken: req.csrfToken(), owned: false, user: user})
      }
    } else {
      return res.render('user.ejs', {csrfToken: req.csrfToken(), owned: false, user: user})
    }
  } else {
    returnres.status(404).send("This user doesnt exist or is an anonymous user.")
  }
})


app.get('/register', function (req, res) {
  if (req.isAuthenticated()){
    return res.redirect('/');
  } else {
    return res.render('register.ejs', {error: ""});
  }
  
});

app.post('/register', function (req, res) {
  var password = req.body.password;
  var password2 = req.body.password2;
  if (password == password2){
    var newUser = new User({
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
    });

    // findOne for username
    User.findOne({username: req.body.username}, function(err, user){
      if(err) {
        console.log(err);
      }
      if(user) {
        res.render('register.ejs', {error: 'username already taken'})
      } else {
        // findOne for email
        User.findOne({email: req.body.email}, function(err, user){
          if(err) {
            console.log(err);
          }
          if(user) {
            res.render('register.ejs', {error: 'email is already in use'})
          } else {
                User.createUser(newUser, function(err, user){
                  if(err) throw err;
                  res.redirect('/login')
                });
          }
      });
      }
  });
  } else{
    res.render('register.ejs', {error: "Passwords don't match, please try again."})
  }
});


app.get('/login', function (req, res, next) {
    console.log(req.isAuthenticated())
    if (req.isAuthenticated()) {
        console.log("is logged in as ", req.user.username)
        return res.redirect('/')
    } else {
        passport.authenticate('local', function (err, user, info) {
            if (info) { console.log('info:', info) }
            if (err) { console.log('this is an error:', err) }
            if (loginerror != null) {
                if (loginerror == 'badUserInput') {
                    loginerror = null
                    return res.render('login.ejs', { error: 'Username or Password is incorrect' });
                } else {
                    loginerror = null
                    return res.render('login.ejs', { error: "" });
                }
            } else {
                return res.render('login.ejs', { error: "" })
            }
            req.logIn(user, function (err) {
                if (err) { return next(err); }
                return res.redirect('/');
            });
        })(req, res, next);
    }
});


app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
}))

io.on('connection', (socket) => {
  let addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});

// app.listen(port)
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
