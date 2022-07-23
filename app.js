//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const http = require('http');
const fs = require('fs');
const session = require('express-session');
const passport = require("passport");
// Passport local mongoose will also salt and hash our passwords
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate= require('mongoose-findorcreate');
require('dotenv').config();
const util= require('util');
const unlinkFile= util.promisify(fs.unlink);;
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
  cloud_name: 'woofyverse', 
  api_key: '812158734764712', 
  api_secret: 'aG5zKoQB1iX2tnqZVfmUsqVOKNU' 
});

const port= process.env.PORT || 8000;
const app = express();

app.use(fileUpload({
  useTempFiles:true
}))

app.set('view engine', 'ejs');

var Publishable_Key=process.env.CLIENT_ID

var Secret_key=process.env.CLIENT_SECRET


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
  callbackURL: "http://localhost:8000/auth/google/woofyverse",
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

const postSchema ={
  dogName: {
   type: String,
   required: true
  },
  date: {
    type:Date,
    required: true
  },
  ownerName: {
    type:String,
    required: true
  },
  shots: {
    type:String,
    required: true
  },
  dogAge: {
    type:String,
    required: true
  },
  spayed: {
    type:String,
    required: true
  },
  neutered: {
    type:String,
    required: true
  },
  vaccinated: {
    type:String,
    required: true
  },
  kids: {
    type:String,
    required: true
  },
  cats: {
    type:String,
    requied: true
  },
  dogs: {
    type:String,
    required: true
  },
  state: {
    type:String,
    required: true
  },
  city: {
    type:String,
    required: true
  },
  gender: {
    type:String,
    required: true
  },
  ownerAddress: {
    type:String,
    required: true
  },
  ownerPhone: {
    type:Number,
    required:true
  },
  additionalOne: {
    type:String,
    required: true
  },
  additionalTwo: {
    type:String,
    required: true
  },
  imagePath: {
    type:String,
    required : true
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
  // if user is registered and signedIn
  if(req.isAuthenticated()){
    Post.find({}, function(err, posts){
      res.render("home", {
        posts: posts,
        });
    }).sort({date:"desc"});
    // If not then first login in order to access the compose page
  }else{
    res.redirect("/login")
  }
});

app.post('/getPosts', (req,res)=>{
  let payload= req.body.payload;
  console.log(payload);
});


app.get("/compose", function(req, res){
  if(req.isAuthenticated()){
    res.render("compose");
    // If not then first login in order to access the compose page
  }else{
    res.redirect("/login")
  }
   
});


app.post("/compose", function(req, res){

  const file = req.files.imageOne;
  cloudinary.uploader.upload(file.tempFilePath,(err,result)=>{
    console.log(result);
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
      imagePath: result.url,
    });
    post.save(function(err){
      if (!err){
          res.redirect("/");
      }
    });
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
      gender:post.gender,
      cats: post.cats,
      dogs: post.dogs,
      state: post.state,
      city: post.city,
      imagePath: post.imagePath,
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
