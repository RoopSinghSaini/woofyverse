// Woofyverse Application: https://www.woofyverse.in/
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
const axios = require("axios");
const { range, result } = require("lodash");


// Using openid library for authentication and session management.

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'a long, randomly-generated string stored in env',
  baseURL: 'https://woofyverse.in',
  clientID: 'u7vJi1WJIxdNMLWN1LAyjleCfvFR4Sta',
  issuerBaseURL: 'https://dev-hri34pn2.us.auth0.com'
};

/*
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'a long, randomly-generated string stored in env',
  baseURL: 'http://localhost:8000',
  clientID: 'u7vJi1WJIxdNMLWN1LAyjleCfvFR4Sta',
  issuerBaseURL: 'https://dev-hri34pn2.us.auth0.com'
};
*/

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

var Publishable_Key='pk_test_51LGKXNSBGKec0tIDWdLF8rK7eHBC4ePrp2IhZgyLQalMzwfFJy601wgs3pBnLOWwIqVPd8BT5bOYwnm61FwUYT9D00rhrPFyNX'

var Secret_key='sk_test_51LGKXNSBGKec0tIDvKV8DRGBCaMa4lYqAEM0XDki3sB3MWS9ypvwWFRAPMC1y6yivAzysUetnboxwDAYc6LiHZy600UnKJYTHC'

const stripe= require('stripe')(Secret_key)

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(methodOverride('_method'))

// Connecting with our mongodb database
mongoose.connect("mongodb+srv://arshroop:Asdfjkl123@cluster0.z4k2m.mongodb.net/?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const postSchema ={dogName:{type: String,required:true},
  duration:{type: String},
  breed:{type: String,required:true},
  adopted:{type: Boolean,required: true},
  date:{type:Date,required:true},
  ownerName:{type:String,required:true},
  shots:{type:String,required:true},
  dogAge:{type:String,required:true},
  spayed:{type:String,required:true},
  neutered:{type:String,required:true},
  vaccinated:{type:String,required:true,},
  kids:{type:String,required:true,},
  cats:{type:String,required:true},
  dogs:{type:String,required:true},
  state:{type:String,required:true},
  city:{type:String,required:true},
  gender:{type:String,required:true},
  ownerAddress:{type:String,required:true},
  ownerPhone:{type:Number,required:true},
  additionalOne:{type:String},
  additionalTwo:{type:String},
imagePath:{type:String,required:true},
randomNumber:Number};

const Post = mongoose.model("Post", postSchema);



app.get('/news',function (req,res) {

  const axios = require("axios");
const options = {
  method: 'GET',
  url: 'https://daily-dog-news.p.rapidapi.com/news',
  headers: {
    'X-RapidAPI-Key': 'aae55d79c0mshe3f425807cb2a6ep1b82a0jsnb5e979ddc835',
    'X-RapidAPI-Host': 'daily-dog-news.p.rapidapi.com'
  }
};
axios.request(options).then(function (response) {
  

  const news= response.data;
/*
      const page = parseInt(req.query.p)
      const limit = response.data.length
  
      const startIndex = (page - 1) * limit
      const endIndex = page * limit
  
      const results = {}
  
      if (endIndex< response.data.length) {
        results.next = {
          page: page + 1,
          limit: limit
        }
      }
      
      if (startIndex > 0) {
        results.previous = {
          page: page - 1,
          limit: limit
        }
      };
results.results= response.data.slice(startIndex,endIndex)
const respo= results.results;
*/

var datas= []
for (var index = 0; index < response.data.length; index++) {
  datas.push(news[index])
}
const length= response.data.length
console.log(datas);

res.render('news',{
    datas:datas,
    length:length,
    text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
  })
}).catch(function (error) {
	res.send(error);
})
})

app.get('/', function (req, res) {
  Post.find({adopted:false}, function(err, posts){

res.render("index", {
  posts:posts,
  text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
});
}).sort({date:"desc"}).limit(5);
})

app.get('/permanent-adoption', function(req,res){
  const axios = require("axios");
const options = {
  method: 'GET',
  url: 'https://dog-facts2.p.rapidapi.com/facts',
  headers: {
    'X-RapidAPI-Key': 'aae55d79c0mshe3f425807cb2a6ep1b82a0jsnb5e979ddc835',
    'X-RapidAPI-Host': 'dog-facts2.p.rapidapi.com'
  }
};
var noMatch = null;
    if(req.query.city || req.query.state) {
        const city = new RegExp(escapeRegex(req.query.city), 'gi');
        const state= new RegExp(escapeRegex(req.query.state), 'gi');
        Post.find({$and:[{state: state}, {city:city},{adopted:false},{duration:"long"}]}, function(err, posts){
           if(err){
               console.log(err);
           } else {
              if(posts.length < 1) {
                  noMatch = "No dogs up for adoption here, try some other place!";
              }
              axios.request(options).then(function (response) {
                const fact=response.data.facts[0];
                console.log(fact);
              res.render("home", {
                posts: posts,
                noMatch: noMatch,
                fact:fact,
                text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
                });   
              }).catch(function (error) {
                console.error(error);
              });
           }
          }).sort({date:"desc"});
    } else {
        // Get all posts from DB
       Post.find({$and:[{adopted:false},{duration:"long"}]}, function(err, posts){
        if(err){
          console.log(err);
        }else{
          axios.request(options).then(function (response) {
            const fact=response.data.facts[0];
            console.log(fact);
          res.render("home", {
            posts: posts,
            noMatch: noMatch,
            fact:fact,
            text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
            });   
          }).catch(function (error) {
            console.error(error);
          });
      }
    }).sort({date:"desc"});
    }
});

app.get('/copyright', function(req, res) {
res.render('copyright',
{
  text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
})
})

app.get('/adopted', function(req, res) {
  Post.find({adopted:true}, function(err, posts){
    if(err){
        console.log(err);
    } else {
       res.render("adopted", {
         posts: posts,
         text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
         });   
    }
   }).sort({date:"desc"});
})

app.get("/compose", function(req, res){
    res.render("compose",{
      text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
    });
});

app.get("/volunteer", function(req, res){
  res.render("volunteer",{
    text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
  });
});

app.get("/report-abuse", function(req, res){
  res.render("abuse",{
    text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
  });
});


app.post("/compose", function(req, res){
  const file = req.files.imageOne;
  cloudinary.uploader.upload(file.tempFilePath,(err,result)=>{
    console.log(result);
    const post = new Post({randomNumber: Math.floor(Math.random()*1000000000000000),dogName: req.body.dogName,breed: req.body.breed,duration: req.body.type,date: req.body.postDate,dogAge: req.body.dogAge,adopted: false,shots: req.body.shots,ownerName: req.body.ownerName,ownerAddress: req.body.address,ownerPhone: req.body.ownerPhone,additionalOne: req.body.additionalOne,additionalTwo: req.body.additionalTwo,spayed: req.body.spayed,gender:req.body.dogGender,neutered: req.body.neutered,vaccinated: req.body.vaccinated,kids: req.body.kids,cats: req.body.cats, dogs: req.body.dogs,state: req.body.state,city: req.body.city,imagePath: result.url});
    post.save(function(err,result){
      if (!err){
        const postId= result._id;
        const ranNum= result.randomNumber;
        res.redirect("/thank-you/"+ranNum+"/"+postId);
      }
    });
  });
  });

app.get("/thank-you/:ranNum/:postId",requiresAuth(), function(req, res){
  const requestedPostId = req.params.postId;
  const ranNum = req.params.ranNum;
  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("thank-you", {text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',dogName: post.dogName, ranNum:ranNum,breed: post.breed,ownerName: post.ownerName,ownerPhone: post.ownerPhone,additionalOne: post.additionalOne,dogAge: post.dogAge, gender:post.gender,adopted: post.adopted,imagePath: post.imagePath,_id: requestedPostId});
  });
});

app.get("/posts/:postId", requiresAuth(), function(req, res){
const requestedPostId = req.params.postId;
const ranNum= req.params.ranNum;
  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", { text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN', dogName: post.dogName,date: post.date, duration: post.duration, breed: post.breed, ownerName: post.ownerName, ownerAddress: post.ownerAddress, ownerPhone: post.ownerPhone, additionalOne: post.additionalOne, additionalTwo: post.additionalTwo, dogAge: post.dogAge, spayed: post.spayed, neutered: post.neutered, vaccinated: post.vaccinated, kids: post.kids, shots: post.shots, gender:post.gender, cats: post.cats, dogs: post.dogs, state: post.state, city: post.city, imagePath: post.imagePath, _id: requestedPostId});
  });
});

app.get("/terms-of-service", function (req, res) {
res.render("tos",{
  text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
})
});

app.get('/experience-adoption', function(req,res){
    const axios = require("axios");
  const options = {
    method: 'GET',
    url: 'https://dog-facts2.p.rapidapi.com/facts',
    headers: {
      'X-RapidAPI-Key': 'aae55d79c0mshe3f425807cb2a6ep1b82a0jsnb5e979ddc835',
      'X-RapidAPI-Host': 'dog-facts2.p.rapidapi.com'
    }
  };
  var noMatch = null;
      if(req.query.city || req.query.state) {
          const city = new RegExp(escapeRegex(req.query.city), 'gi');
          const state= new RegExp(escapeRegex(req.query.state), 'gi');
          
          Post.find({$and:[{state: state}, {city:city},{adopted:false},{duration:"others"}]}, function(err, posts){
             if(err){
                 console.log(err);
             } else {
                if(posts.length < 1) {
                    noMatch = "No dogs up for adoption here, try some other place!";
                }
                axios.request(options).then(function (response) {
                  const fact=response.data.facts[0];
                  console.log(fact);
                res.render("temporary", {
                  posts: posts,
                  text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
                  noMatch: noMatch,
                  fact:fact,
                  });   
                }).catch(function (error) {
                  console.error(error);
                });
             }
            }).sort({date:"desc"});
      } else {
          // Get all posts from DB
         Post.find({$and:[{adopted:false},{duration:"others"}]}, function(err, posts){
          if(err){
            console.log(err);
          }else{
            axios.request(options).then(function (response) {
              const fact=response.data.facts[0];
              console.log(fact);
          
            res.render("temporary", {
              posts: posts,
              text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
              noMatch: noMatch,
              fact:fact,
              });   
            }).catch(function (error) {
              console.error(error);
            });
        }
      }).sort({date:"desc"});
      }
  });

app.get("/adopted/posts/:postId/", requiresAuth(), function(req, res){
  const requestedPostId = req.params.postId;
    Post.findOne({_id: requestedPostId}, function(err, post){
      res.render("adopted-post", {dogName: post.dogName, text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN', date: post.date, duration: post.duration, breed: post.breed, additionalOne: post.additionalOne, additionalTwo: post.additionalTwo, dogAge: post.dogAge, spayed: post.spayed, neutered: post.neutered, vaccinated: post.vaccinated, kids: post.kids, shots: post.shots, gender:post.gender, cats: post.cats, dogs: post.dogs, imagePath: post.imagePath, _id: requestedPostId});
    });
  });

app.get("/:postId/edit/:ranNum", requiresAuth(), function (req, res) {
  const requestedPostId = req.params.postId;
  
  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("edit", {dogName: post.dogName, text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN', date: post.date, duration: post.duration, breed: post.breed, ownerName: post.ownerName, ownerAddress: post.ownerAddress, ownerPhone: post.ownerPhone, additionalOne: post.additionalOne, additionalTwo: post.additionalTwo, dogAge: post.dogAge, spayed: post.spayed, neutered: post.neutered, vaccinated: post.vaccinated, kids: post.kids, adopted: post.adopted, shots: post.shots, gender:post.gender, cats: post.cats, dogs: post.dogs, state: post.state, city: post.city, imagePath: post.imagePath, _id: requestedPostId});
  });
});

// route to handle updates
app.put('/:postId/edit/:ranNum',requiresAuth(), function (req, res) {
      const requestedPostId = req.params.postId; dogName= req.body.dogName,
adopted= req.body.adopted, duration= req.body.type, breed= req.body.breed, ownerName= req.body.ownerName, ownerAddress= req.body.address, ownerPhone= req.body.ownerPhone, additionalOne= req.body.additionalOne, additionalTwo= req.body.additionalTwo, dogAge= req.body.dogAge, spayed= req.body.spayed, neutered= req.body.neutered, vaccinated= req.body.vaccinated, kids= req.body.kids, shots= req.body.shots, gender=req.body.dogGender, cats= req.body.cats, dogs= req.body.dogs, state= req.body.state,city= req.body.city, _id= requestedPostId,
      
  Post.updateOne({_id: requestedPostId}, {$set:{dogName:dogName,duration:duration,
    city:city,state:state,adopted:adopted,dogs:dogs,kids:kids,cats:cats,gender:gender,
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

app.get("/delete/:postId/:ranNum",requiresAuth(),function(req,res){
  Post.deleteOne({_id: req.params.postId},function(err){
    if(err){
      console.log(err);
  }else{
  res.redirect('/')
  }
});
});

app.get('/donate', function(req, res){
  res.redirect("https://payments-test.cashfree.com/forms/donation-woofyverse")
})

/*
app.get('/donation', requiresAuth(), function(req, res){
    res.render('donation', {
      key: Publishable_Key,
      text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN',
   })
})
app.post('/donation',requiresAuth(), function(req, res){
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
          amount: 100,     // Charing Rs 25
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
*/

app.get('/breed', function(req, res){
  var noMatch = null;
  if(req.query.breed) {
    const breed = new RegExp(escapeRegex(req.query.breed), 'gi');
    const breedAPI=  new RegExp(spaceReplace(req.query.breed));
    const options = {
      method: 'GET',
      url: 'https://dog-breeds2.p.rapidapi.com/dog_breeds/breed'+breedAPI,
      headers: {
        'X-RapidAPI-Key': 'aae55d79c0mshe3f425807cb2a6ep1b82a0jsnb5e979ddc835',
        'X-RapidAPI-Host': 'dog-breeds2.p.rapidapi.com'
      }
    };
    Post.find({$and:[{breed:breed},{adopted:false}]}, function(err, posts){
       if(err){
           console.log(err);
       } else {
          if(posts.length < 1) {
              noMatch = "No dogs matching the breed are up for adoption, try some other breed!";
          }
          axios.request(options).then(function send (response) {
            const data= response.data
            const breed = response.data[0].breed
            const origin= response.data[0].origin
            const wikipedia= response.data[0].url
            const image= response.data[0].img
            const height= response.data[0].meta.height
            const weight= response.data[0].meta.weight
            const coat= response.data[0].meta.coat
            const life= response.data[0].meta.life_span
            const nickname= response.data[0].meta.other_names
            const color= response.data[0].meta.colour
            console.log(response.data);
            res.render("breed", {posts: posts, text: req.oidc.isAuthenticated() ? 'LOGOUT' : 'LOGIN', noMatch: noMatch, breed: breed, origin: origin, wikipedia: wikipedia,image: image, height: height, weight: weight, coat: coat, life: life, nickname: nickname, color: color, });   
         }).catch(function (error) {
          console.error(error);
        });
       }
      }).sort({date:"desc"});
} else {
    // Get all posts from DB
        res.redirect('/breed?breed=Indian+pariah+dog')
}
  })

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

function spaceReplace(text) {
  return text.replace(/\s+/g, '%20');
}

setInterval(() => {
  http.get("https://woofyverse.onrender.com/");
}, 25 * 60 * 1000); // every 25 minutes

app.listen(port, function() {
  console.log("Server started sucessfully");
});