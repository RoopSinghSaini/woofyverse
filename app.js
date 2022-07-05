//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const http = require('http');
const multer = require('multer')
const fs = require('fs')
const path = require('path');
const session = require('express-session');
const passport = require("passport");
// Passport local mongoose will also salt and hash our passwords
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate= require('mongoose-findorcreate')
require('dotenv/config');

const port= process.env.PORT || 8000;
const app = express();

app.set('view engine', 'ejs');

var Publishable_Key= 'pk_test_51LGKXNSBGKec0tIDWdLF8rK7eHBC4ePrp2IhZgyLQalMzwfFJy601wgs3pBnLOWwIqVPd8BT5bOYwnm61FwUYT9D00rhrPFyNX'

var Secret_key='sk_test_51LGKXNSBGKec0tIDvKV8DRGBCaMa4lYqAEM0XDki3sB3MWS9ypvwWFRAPMC1y6yivAzysUetnboxwDAYc6LiHZy600UnKJYTHC'


const stripe= require('stripe')(Secret_key)

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Session Config
app.use(session({
  secret: "Woof!",
  resave: false,
  saveUninitialized: false
}));

// Initialized passport
app.use(passport.initialize());
// Using passport to manage site sessions
app.use(passport.session());

mongoose.connect("mongodb+srv://arshroop:Asdfjkl123@cluster0.z4k2m.mongodb.net/?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);
// making our user schema to save in mongoDB database
const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
});

// making our user model using passportLocalMongoose
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

// using passport to create a stratergy
passport.use(User.createStrategy());

// Creates the session cookie for user
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

// Opens up the info in the cookie for identifying the user
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});



passport.use(new GoogleStrategy({
  clientID: "347226813668-b7qq6253mhlrbfiddqc2qd9b9lg06stu.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "https://woofyverse.herokuapp.com/auth/google/woofyverse",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

// Using multer for uploading image files to our database
// defining the destination location for saving our images and a format for naming each image file.
const Storage= multer.diskStorage({
  destination: 'public/uploads',
  filename:(req,file,cb)=>{
    cb(null, file.fieldname + '-' + Date.now());
  },
})

// Creating the middleware that we would use in our app.post for handling file posts
const upload = multer({
  storage: Storage
})


const postSchema ={
  dogName: String,
  date: Date,
  ownerName: String,
  shots: String,
  dogAge: String, 
  spayed: String,
  neutered: String,
  vaccinated: String,
  kids: String,
  cats: String,
  dogs: String,
  state: String,
  city: String,
  ownerAddress: String,
  ownerPhone: Number,
  additionalOne: String,
  additionalTwo: String,
  img:
  {
      data: Buffer,
      contentType: String
  }
};
const Post = mongoose.model("Post", postSchema);

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/woofyverse",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to compose page.
    res.redirect("/compose");
  });

app.get("/login", function(req, res){
  res.render("login");
});

app.post("/login", function(res,req){
  const user= new User({
    username: req.body.username,
    password: req.body.password
  })
// this method comes from password
  req.login(user, function(err){
    if(err){
      console.log(err)
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect('/compose')
      })
    }
  })
})

app.get("/register", function(req, res){
  res.render("register");
});


app.post("/register", function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err,user){
    // If error or user already registered
    if(err){
      console.log(err);
      res.render("register");
      // If registered sucessfully
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect('/compose')
      })
    }
  })
  
});

app.use(
  session({ 
    cookie: {
      path: '/',
      httpOnly: false,
      secure: false,
      maxAge: null,
    },
  })
)

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.get("/", function(req, res){
  Post.find({}, function(err, posts){
    res.render("home", {
      posts: posts,
      });
  }).sort({date:"desc"});

});

app.post('/getPosts', (req,res)=>{
  let payload= req.body.payload;
  console.log(payload);
});

app.get("/compose", function(req, res){
  // if user is registered and signedIn
  if(req.isAuthenticated()){
    res.render("compose");
    // If not then first login in order to access the compose page
  }else{
    res.redirect("/login")
  }

});

// Using the upload middleware
app.post("/compose", upload.single('image'), function(req, res){
  const post = new Post({
    dogName: req.body.dogName,
    date: req.body.postDate,
    dogAge: req.body.dogAge,
    shots: req.body.shots,
    ownerName: req.body.ownerName,
    ownerAddress: req.body.ownerAddress,
    ownerPhone: req.body.ownerPhone,
    additionalOne: req.body.additionalOne,
    additionalTwo: req.body.additionalTwo,
    spayed: req.body.spayed,
    gender:req.body.dogGender,
    neutered: req.body.neutered,
    vaccinated: req.body.vaccinated,
    kids: req.body.kids,
    cats: req.body.cats,
    dogs: req.body.dogs,
    state: req.body.ownerState,
    city: req.body.ownerCity,
    img: {
      data: fs.readFileSync(path.join(__dirname + '/public/uploads/' + req.file.filename)),
      contentType: 'image/png'
  }
    
  });


  post.save(function(err){
    if (!err){
        res.redirect("/");
    }
  });
});

app.get("/posts/:postId", function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      dogName: post.dogName,
      date: post.date,
      ownerName: post.ownerName,
      ownerAddress: post.ownerAddress,
      ownerPhone: post.ownerPhone,
      additionalOne: post.additionalOne,
      additionalTwo: post.additionalTwo,
      dogAge: post.dogAge,
      spayed: post.spayed,
      neutered: post.neutered,
      vaccinated: post.vaccinated,
      kids: post.kids,
      shots: post.shots,
      gender:post.dogGender,
      cats: post.cats,
      dogs: post.dogs,
      state: post.state,
      city: post.city,
      img: post.img,  
      _id: requestedPostId 
    });
  });

});

app.get('/donation', function(req, res){
  // if user is registered and signedIn
  if(req.isAuthenticated()){
    res.render('donation', {
      key: Publishable_Key
   })
    // If not then first login in order to access the compose page
  }else{
    res.redirect("/login")
  }
})

app.post('/donation', function(req, res){

  stripe.customers.create({
      email: req.body.stripeEmail,
      source: req.body.stripeToken,
      name: req.body.donatorName,
      address: {
          line1: req.body.donatorAddress,
          postal_code: req.body.postalCode,
          city: req.body.donatorCity,
          state: req.body.donatorState,
          country: req.body.donatorCountry,
      }
  })
  .then((customer) => {

      return stripe.charges.create({
          amount: 25,     // Charing Rs 25
          description: 'Woofyverse animal rescue',
          currency: 'INR',
          customer: customer.id
      });
  })
  .then((charge) => {
      res.send("Success")  // If no error occurs
  })
  .catch((err) => {
      res.send(err)       // If some error occurs
  });
})



setInterval(() => {
  http.get("https://woofyverse.herokuapp.com/");
}, 25 * 60 * 1000); // every 25 minutes

app.listen(port, function() {
  console.log("Server started sucessfully");
});
