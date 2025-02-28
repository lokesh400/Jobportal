const express = require("express");
const router = express.Router();
const User = require('../models/User');
const Worker = require('../models/Worker');

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
  
// // Signup route
// router.get('/worker/index', (req, res) => {
//     req.flash('error_msg', 'Hello Dear');
//     res.render("employee/workerIndex.ejs");
// });

router.get('/employer/signup', (req, res) => {
  req.flash('error_msg', 'Hello Dear');
  res.render("./users/employerSignup.ejs");
});


router.post("/signup/worker", async (req, res, next) => {
try {
  const { name, email, password, contactNumber, skills, address,pincode,photo } = req.body;
  const username = email
  const worker = new User({ name, email, username,role: "worker" });
  const registeredWorker = await User.register(worker, password);
  const newWorker = new Worker({
        name,
        mobile:contactNumber,
        address,
        email,
        pincode,
        photo,
        skills: skills.split(","),
        projects:[],
  })
  await newWorker.save();
  req.login(registeredWorker, (err) => {
    if (err) {
      console.error("Login error after registration:", err);
      return res.status(500).json({ error: "Login failed after registration" });
    }
    return res.json({ message: "Worker registered and logged in", user: req.user });
  });
} catch (error) {
  console.error("Signup error:", error);
  res.status(500).json({ error: error.message });
}
});


module.exports = router;



