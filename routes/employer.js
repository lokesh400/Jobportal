const express = require("express");
const router = express.Router();
const User = require('../models/User');
const Employer = require('../models/Employer');

const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const { error } = require("console");

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save files to 'uploads/' folder
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

// Initialize multer with diskStorage
const upload = multer({ storage: storage });

const Upload = {
  uploadFile: async (filePath) => {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "auto",
      });

      // Delete local file after successful upload
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting local file:", err);
      });

      return result;
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      throw new Error("Upload failed: " + error.message);
    }
  },
};

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.render("./error/accessdenied.ejs");
}

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
}
  

//create new Opening
router.get('/admin', (req, res) => {
  req.flash('error_msg', 'Hello Dear');
  res.render("employer/adminIndex.ejs");
});

// Signup route
router.get('/worker/index', (req, res) => {
    req.flash('error_msg', 'Hello Dear');
    res.render("employee/adminIndex.ejs");
});

router.get('/employer/signup', (req, res) => {
  req.flash('error_msg', 'Hello Dear');
  res.render("./users/employerSignup.ejs");
});


router.post("/signup/new/employer", async (req, res, next) => {
  try {
    const { name, email, password, mobile, company, address,pincode,photo } = req.body;
    const username = email;
    const employer = new User({ name, email, username, contactNumber:mobile, role: "admin" });
     new Employer({ name, email, mobile, address, pincode,photo,company  }).save();
    await User.register(employer, password);
    req.login(employer, (err) => {
      if (err) {
        console.error("Login after signup failed:", err);
        return next(err);
      }
      res.redirect("/dashboard");
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).send(error);
  }
});

//create new Opening
router.get('/new/opening', (req, res) => {
  req.flash('error_msg', 'Hello Dear');
  res.render("employer/createJob.ejs");
});

router.post("/create/new/opening", ensureAuthenticated, async (req, res) => {
  try {
      const { title, description, location, pincode } = req.body;
      const user = await User.findById(req.user.id);
      const mail = user.email;
      const creater = await Employer.findOne({email:mail})
      // Create a new job instance
      const newJob = new Job({
          title,
          description,
          employerId:creater.id,
          location,
          pincode,
          mobile:creater.mobile,
      });

      // Save job to database
      await newJob.save();
      
      res.status(201).json({ message: "Job posted successfully!", job: newJob });
  } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ error: "Server error. Please try again later." });
  }
});

module.exports = router;



