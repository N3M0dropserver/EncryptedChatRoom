const express = require('express');
const app = express();
const PORT = 3333;
const socket = require("socket.io");
const server = require('http').createServer(app);
const io = socket(server);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectID;
const passport = require('passport');
const User = require('./models/user');
const blogpost = require('./models/message');
const fileUpload = require('express-fileupload');
var loginerror = undefined
var numUsers = 0;

app.use(require('express-session')({
    secret: 'secret key here',
    saveUninitialized: true,
    resave: true
}));

app.use(passport.initialize());
app.use(passport.session());

// default options
app.use(fileUpload());

// Conenct to DB
mongoose.connect('mongodb://localhost/encchat');
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
    if (req.isAuthenticated()){
        socket.emit('login', {
          numUsers: numUsers++
        });
        res.render('chat.ejs', {user: req.user})
    } else {
        res.redirect('/register')
    }
    
})



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
        console.log("is not logged in")
        console.log("loginerror:", loginerror)
        passport.authenticate('local', function (err, user, info) {
            if (info) { console.log('info:', info) }
            if (err) { console.log('this is an error:', err) }
            if (loginerror != null) {
                if (loginerror == 'badUserInput') {
                    loginerror = null
                    console.log("rendering login.ejs 1")
                    return res.render('login.ejs', { error: 'Username or Password is incorrect' });
                } else {
                    loginerror = null
                    console.log("rendering login.ejs 2")
                    return res.render('login.ejs', { error: "" });
                }
            } else {
                console.log("rendering login.ejs")
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

// app.listen(port)
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
