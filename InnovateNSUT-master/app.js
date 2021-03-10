const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const encrypt = require("mongoose-encryption"); ///
const passport = require("passport"); ///
const passportlocalmongoose = require("passport-local-mongoose"); ///

const findOrCreate = require("mongoose-findorcreate"); //5
const app = express();
let patientID = "";

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
  age: Number,
  gender: String,
  password: String,
  queries: Array,
});

const vaccinationSchema = new mongoose.Schema({
  date: String,
  medicalIssue: String,
  patientInfo: patientSchema,
});

const secret = "Thisisourlittlesecret.";
patientSchema.plugin(encrypt, {
  secret: secret,
  encryptedFields: ["password"],
});

patientSchema.plugin(passportlocalmongoose); ///
patientSchema.plugin(findOrCreate);

const Patient = new mongoose.model("Patient", patientSchema);
const VaccinationDetail = new mongoose.model(
  "VaccinationDetail",
  vaccinationSchema
);

passport.use(Patient.createStrategy());

passport.serializeUser(Patient.serializeUser());
passport.deserializeUser(Patient.deserializeUser());

app.get("/", function (req, res) {
  res.render("profile");
});

app.get("/contact", function (req, res) {
  res.render("contact");
});

app.get("/vaccination", function (req, res) {
  res.render("vaccination");
});

app.get("/appointment", function (req, res) {
  res.render("appointment");
});

app.get("/index", function (req, res) {
  res.render("index");
});

app.get("/logout", function (req, res) {
  res.redirect("login");
});

app.get("/profile", function (req, res) {
  Patient.findOne({ email: patientID }, function (err, foundPatient) {
    if (err) {
      console.log(err);
    } else {
      console.log("success");
      if (foundPatient.gender === "Female") {
        profileSrc = "https://www.bootdey.com/img/Content/avatar/avatar8.png";
      } else {
        profileSrc = "https://www.bootdey.com/img/Content/avatar/avatar7.png";
      }

      res.render("profile", {
        patientName: foundPatient.name,
        patientAge: foundPatient.age,
        patientGender: foundPatient.gender,
        patientEmail: foundPatient.email,
        patientProfilePic: profileSrc,
      });
    }
  });
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/register", function (req, res) {
  const patient = new Patient({
    name: req.body.name,
    email: req.body.username,
    password: req.body.password,
    age: req.body.age,
    gender: req.body.gender,
  });

  patient.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("login");
    }
  });
});

app.post("/login", function (req, res) {
  console.log(req.body);
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
          patientID = email;
          // Patient.getIndexes({email:null},function(err,nullFound){
          //   if(err){
          //            console.log(err);
          //   }else{
          //    Patient.dropIndex(nullFound._id);
          //   }
          // })
          res.redirect("profile");
        }
      }
    }
  });
});

app.post("/appointment/:medical", function (req, res) {
  const medicalIssue = req.params.medical;
  const dateOfAppointment = new Date();

  Patient.findOne({ email: patientID }, function (err, foundP) {
    if (err) {
      console.log(err);
    } else {
      console.log(foundP);

      const appointmentInfo = new VaccinationDetail({
        medicalIssue: medicalIssue,
        date: dateOfAppointment,
        patientInfo: foundP,
      });

      console.log(appointmentInfo);
      appointmentInfo.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("sucess");
        }
      });
    }
  });
});

app.post("/vaccination", function (req, res) {
  const dateOfAppointment = new Date();
  const medicalIssue = "vaccination";

  Patient.findOne({ email: patientID }, function (err, foundP) {
    if (err) {
      console.log(err);
    } else {
      console.log(foundP);

      const vaccinationAppointment = new VaccinationDetail({
        medicalIssue: medicalIssue,
        date: dateOfAppointment,
        patientInfo: foundP,
      });

      console.log(vaccinationAppointment);
      vaccinationAppointment.save(function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("sucess");
        }
      });
    }
  });
});

app.post("/appointment", function (req, res) {
  const askedQuestion = req.body.query;
  console.log(req.body);

  Patient.updateOne({}, { $push: { queries: askedQuestion } }, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("success");
    }
  });
});

app.listen(3000, function () {
  console.log("Server is running fine");
});
