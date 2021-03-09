const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const encrypt = require("mongoose-encryption"); ///
const passport = require("passport"); ///
const passportlocalmongoose = require("passport-local-mongoose"); ///
const GoogleStrategy = require("passport-google-oauth20").Strategy; //1
const findOrCreate = require("mongoose-findorcreate"); //5
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    ///
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize()); ///
app.use(passport.session());
app.use(express.static(__dirname + "/public"));

mongoose.connect("mongodb://localhost:27017/patientsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.set("useCreateIndex", true);
const patientSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const secret = "Thisisourlittlesecret.";
patientSchema.plugin(encrypt, {
  secret: secret,
  encryptedFields: ["password"],
});

patientSchema.plugin(passportlocalmongoose); ///
patientSchema.plugin(findOrCreate);
const Patient = new mongoose.model("Patient", patientSchema);

passport.use(Patient.createStrategy());

passport.serializeUser(Patient.serializeUser());
passport.deserializeUser(Patient.deserializeUser());

passport.use(
  new GoogleStrategy(
    {
        clientID: "822726882335-912euq5frefokokcfc1s8njkd4li4fg7.apps.googleusercontent.com",
        clientSecret: "4aSwUj5bMSkOMKjxLPToXUQR",
      callbackURL: "http://localhost:3000/auth/google/helTH",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      Patient.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/contact.html", function (req, res) {
  res.sendFile(__dirname + "/contact.html");
});

app.get("/vaccination.html", function (req, res) {
  res.sendFile(__dirname + "/vaccination.html");
});


app.get("/appointment.html", function (req, res) {
  res.sendFile(__dirname + "/appointment.html");
});

app.get("/index.html", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/profile.html", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("profile");
  } else {
    res.redirect("login");
  }
});

app.get("/login", function (req, res) {
  res.sendFile(__dirname + "/login.html");
});

app.post("/register", function (req, res) {
  const patient = new Patient({
    name: req.body.name,
    email: req.body.username,
    password: req.body.password,
  });

  patient.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("login");
    }
  });
  // Patient.register({email:req.body.username},req.body.password,function(err,user){
  //     if(err)
  //     {
  //         console.log(err);
  //         res.redirect("login");
  //     }
  //     else{
  //      passport.authenticate("local")(req,res,function(){
  //          res.redirect("profile");
  //      })
  //     }
  // })
});

app.post("/login", function (req, res) {
  const email = req.body.username;
  const password = req.body.password;

  Patient.findOne({ email: email }, function (err, foundPatient) {
    if (err) {
      console.log(err);
      res.redirect("login");
    } else {
      if (foundPatient) {
        if (foundPatient.password === password) {
          console.log("success");
          res.sendFile(__dirname + "/index.html");
        }
      }
    }
  });
});

// app.get('/auth/google',function(req,res){                           //7
//     passport.authenticate('google', { scope: ['profile'] });
// });

app.listen(3000, function () {
  console.log("Server is running fine");
});
