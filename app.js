// Woofyverse Application: https://www.woofyverse.com/
// Copyright (c) 2022 Woofyverse.
// Adopt a buddy!

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const http = require('http');
const fs = require('fs');
require('dotenv').config();
const util= require('util');
const unlinkFile= util.promisify(fs.unlink);;
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const { auth, requiresAuth } = require('express-openid-connect');
const methodOverride= require("method-override")
const favicon= require('serve-favicon');
const path= require('path');
const { log } = require("console");

function randomNumber(max) {
  return Math.floor(Math.random()*max);
}

let x = randomNumber(1000000000);
console.log(x)

// Using openid library for authentication and session management.
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'a long, randomly-generated string stored in env',
  baseURL: 'http://woofyverse.herokuapp.com',
  clientID: 'u7vJi1WJIxdNMLWN1LAyjleCfvFR4Sta',
  issuerBaseURL: 'https://dev-hri34pn2.us.auth0.com'
};

// Using cloudinary library for hosting images path and then storing images path in mongodb database.
cloudinary.config({ 
  cloud_name: 'woofyverse', 
  api_key: '812158734764712', 
  api_secret: 'aG5zKoQB1iX2tnqZVfmUsqVOKNU' 
});

const port= process.env.PORT || 8000;
const app = express();
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(auth(config));
app.use(fileUpload({
  useTempFiles:true
}))

app.set('view engine', 'ejs');

var Publishable_Key=process.env.CLIENT_ID

var Secret_key=process.env.CLIENT_SECRET

const stripe= require('stripe')(Secret_key)

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(methodOverride('_method'))

// Connecting with our mongodb database
mongoose.connect("mongodb+srv://arshroop:Asdfjkl123@cluster0.z4k2m.mongodb.net/?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const postSchema ={
  dogName: {
   type: String,
   
  },
  breed:{
    type: String,
    
  },
  date: {
    type:Date,
    
  },
  ownerName: {
    type:String,
    
  },
  shots: {
    type:String,
    
  },
  dogAge: {
    type:String,
    
  },
  spayed: {
    type:String,
    
  },
  neutered: {
    type:String,
    
  },
  vaccinated: {
    type:String,
    
     },
  kids: {
    type:String,
    
  },
  cats: {
    type:String,
    
  },
  dogs: {
    type:String,
    
  },
  state: {
    type:String,
    
  },
  city: {
    type:String,
    
  },
  gender: {
    type:String,
    
  },
  ownerAddress: {
    type:String,
    
  },
  ownerPhone: {
    type:Number,
    
  },
  additionalOne: {
    type:String,
  },
  additionalTwo: {
    type:String,
  },
  imagePath: {
    type:String
}
};
const Post = mongoose.model("Post", postSchema);

app.get('/',function(req,res){
if (req.oidc.isAuthenticated()) {
var noMatch = null;
    if(req.query.city || req.query.state) {
        const city = new RegExp(escapeRegex(req.query.city), 'gi');
        const state= new RegExp(escapeRegex(req.query.state), 'gi');
        
        Post.find({$and:[{state: state}, {city:city}]}, function(err, posts){
           if(err){
               console.log(err);
           } else {
              if(posts.length < 1) {
                  noMatch = "No dogs up for adoption here, try some other place!";
              }
              res.render("home", {
                posts: posts,
                noMatch: noMatch,
                });   
           }
          }).sort({date:"desc"});
    } else {
        // Get all posts from DB
       Post.find({}, function(err, posts){
        if(err){
          console.log(err);
        }else{
      res.render("home", {
        posts: posts,
        noMatch: noMatch,
        });
      }
    }).sort({date:"desc"});
    }
  }else {
    res.redirect('/login')
  }
});


app.get("/compose", requiresAuth(), function(req, res){
    res.render("compose");
});

app.post("/compose", function(req, res){

  const file = req.files.imageOne;
  cloudinary.uploader.upload(file.tempFilePath,(err,result)=>{
    console.log(result);
    const post = new Post({
      dogName: req.body.dogName,
      breed: req.body.breed,
      date: req.body.postDate,
      dogAge: req.body.dogAge,
      shots: req.body.shots,
      ownerName: req.body.ownerName,
      ownerAddress: req.body.address,
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
      state: req.body.state,
      city: req.body.city,
      imagePath: result.url,
    });
    post.save(function(err,result){
      if (!err){
        const postId= result._id;
        res.redirect("/thank-you/"+x+"/"+postId);
      }
    });
  });
  });

app.get("/thank-you/"+x+"/:postId", function(req, res){
  const requestedPostId = req.params.postId;
  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("thank-you", {
      dogName: post.dogName,
      x: x,
      breed: post.breed,
      ownerName: post.ownerName,
      ownerPhone: post.ownerPhone,
      additionalOne: post.additionalOne,
      dogAge: post.dogAge,
      gender:post.gender,
      imagePath: post.imagePath,
      _id: requestedPostId 
    });
  });
});

app.get("/posts/:postId/", requiresAuth(), function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      dogName: post.dogName,
      date: post.date,
      breed: post.breed,
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

app.get("/:postId/edit/"+x, requiresAuth(), function (req, res) {
  const requestedPostId = req.params.postId;
  
  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("edit", {
      dogName: post.dogName,
      date: post.date,
      breed: post.breed,
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

// route to handle updates
app.put('/:postId/edit', function (req, res) {
      const requestedPostId = req.params.postId;
      dogName= req.body.dogName,
      breed= req.body.breed,
      ownerName= req.body.ownerName,
      ownerAddress= req.body.address,
      ownerPhone= req.body.ownerPhone,
      additionalOne= req.body.additionalOne,
      additionalTwo= req.body.additionalTwo,
      dogAge= req.body.dogAge,
      spayed= req.body.spayed,
      neutered= req.body.neutered,
      vaccinated= req.body.vaccinated,
      kids= req.body.kids,
      shots= req.body.shots,
      gender=req.body.dogGender,
      cats= req.body.cats,
      dogs= req.body.dogs,
      state= req.body.state,
      city= req.body.city,
      _id= requestedPostId,
      
  Post.updateOne({_id: requestedPostId}, {$set:{dogName:dogName,
    city:city,state:state,dogs:dogs,kids:kids,cats:cats,gender:gender,
    shots:shots,vaccinated:vaccinated,neutered:neutered,spayed:spayed,dogAge:dogAge,
  additionalTwo:additionalTwo,additionalOne:additionalOne,ownerName:ownerName,ownerPhone:ownerPhone,
  breed:breed,ownerAddress:ownerAddress}},{new:true},(err,data)=>{
    if(err){
      console.log(err)
    }else{
      console.log(data);
      res.redirect('/')
    }
  })
  })

app.get('/delete/:postId/'+x,requiresAuth(),function(req,res){
  Post.deleteOne({_id: req.params.postId},function(err){
    if(err){
      console.log(err);
  }else{
  res.redirect('/')
  }
});
});

app.get('/donation', requiresAuth(), function(req, res){
    res.render('donation', {
      key: Publishable_Key
   })
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



function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

setInterval(() => {
  http.get("https://woofyverse.herokuapp.com/");
}, 25 * 60 * 1000); // every 25 minutes

app.listen(port, function() {
  console.log("Server started sucessfully");
});
