const express = require("express");
const router = express.Router();
const mongoose = require("mongoose")
const User = require('../models/User');
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Worker = require('../models/Worker');
const axios = require("axios");

const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const { error } = require("console");
const Thekedar = require("../models/Thekedar");

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
router.get('/admin', async (req, res) => {
  req.flash('error_msg', 'Hello Dear');
  const user = await User.findById(req.user.id);
  const mail = user.email;
  const admin = await Employer.findOne({email:mail});
  const openings = await Job.find({employerId:admin.id})
  res.render("employer/adminIndex.ejs",{admin,openings});
});

//apply for the job
router.post('/apply/this/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(req.user)
    let user = await Thekedar.findOne({ email: req.user.email });
    if (!user) {
      user = await Worker.findOne({ email: req.user.email });
    }
    if (!user) {
      return res.status(400).send("User not found");
    }
    await new Application({
      workerId: user._id,
      jobId: id,
    }).save();
    req.flash('success_msg',"Applied Successfully");
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//All Queries
router.get('/opening/:id', async (req, res) => {
  const { id } = req.params;
  try {
      const objectId = new mongoose.Types.ObjectId(id);
      // Fetch applications and populate both workerId and jobId
      const applications = await Application.find({ jobId: objectId })
          .populate("workerId")
          .populate("jobId");
      console.log("Applications:", applications); // Debugging log
      res.render("employer/jobRequest.ejs", { applications });
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
  }
});


// Accept job request and assign it to only one user
router.post("/requests/accept/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id).populate("workerId").populate("jobId");
    if (!application) {
      return res.status(404).send("Application not found");
    }
    const worker = await Worker.findById(application.workerId);
    const thekedar = await Thekedar.findById(application.workerId);
    if (!worker && !thekedar) {
      return res.status(404).send("User not found");
    }
    // Update application status to "Accepted"
    application.status = "Accepted";
    await application.save();
    // Create project data
    const projectData = {
      title: application.jobId.title,
      address: application.jobId.location,
      pincode: application.jobId.pincode,
      photo: "", // Add photo if needed
      description: application.jobId.description,
    };
    // Assign job to only one user (either Worker or Thekedar)
    if (worker) {
      await Worker.findByIdAndUpdate(worker._id, { $push: { projects: projectData } });
    } else if (thekedar) {
      await Thekedar.findByIdAndUpdate(thekedar._id, {
        $push: { projects: { ...projectData, thisProjectWorkers: [worker?._id] } },
      });
    }
    req.flash('success_msg',"Assignes Successfully Successfully");
    res.redirect("/admin");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error accepting request");
  }
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
      req.flash('success_msg',"registred successfully");
      res.redirect("/");
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

async function getCoordinatesFromPincode(pincode) {
  try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?postalcode=${pincode}&countrycodes=IN&format=json`);
      
      if (response.data.length > 0) {
          return {
              latitude: parseFloat(response.data[0].lat),
              longitude: parseFloat(response.data[0].lon)
          };
      }
      return null;
  } catch (error) {
      console.error("❌ Error fetching coordinates:", error);
      return null;
  }
}

router.post("/create/new/opening", ensureAuthenticated, async (req, res) => {
  try {
      const { title, description, pincode,address } = req.body;
      const user = await User.findById(req.user.id);
      const employer = await Employer.findOne({ email: user.email });
      if (!employer) {
          return res.status(404).json({ error: "Employer not found" });
      }
      const coordinates = await getCoordinatesFromPincode(pincode);
      if (!coordinates) {
          return res.status(400).json({ error: "Invalid Pincode. Unable to fetch coordinates." });
      }
      // Create a new job instance
      const newJob = new Job({
          title,
          address,
          description,
          employerId: employer.id,
          pincode,
          mobile: employer.mobile,
          location: {
              type: "Point",
              coordinates: [coordinates.longitude, coordinates.latitude] // [lng, lat]
          }
      });
      // Save job to database
      await newJob.save();
      req.flash('success_msg',"Applied Successfully");
      res.redirect('/')
  } catch (error) {
      console.error("❌ Error creating job:", error);
      res.status(500).json({ error: "Server error. Please try again later." });
  }
});

router.get('/jobs', async (req, res) => {
  try {
      const jobs = await Job.find({}); // Fetch all jobs initially
      res.render('employee/viewJobs.ejs', { jobs, pincode: null });
  } catch (error) {
      console.error("❌ Error fetching jobs:", error);
      req.flash('error_msg', 'Something went wrong.');
      res.redirect('/');
  }
});

// Search Jobs by Pincode
router.get('/jobs/search', async (req, res) => {
  try {
      const { pincode } = req.query;

      if (!pincode) {
          req.flash('error_msg', 'Please enter a valid pincode.');
          return res.redirect('/jobs');
      }
      // Convert Pincode to Coordinates
      const coordinates = await getCoordinatesFromPincode(pincode);
      if (!coordinates) {
          req.flash('error_msg', 'Invalid Pincode. Try another.');
          return res.redirect('/jobs');
      }
      // Find Nearby Jobs Using MongoDB's Geospatial Query
      const jobs = await Job.aggregate([
          {
              $geoNear: {
                  near: { type: "Point", coordinates: [coordinates.longitude, coordinates.latitude] },
                  distanceField: "distance",
                  maxDistance: 50000, // 5 KM radius
                  spherical: true
              }
          }
      ]);

      res.render('employee/viewJobs.ejs', { jobs, pincode });
  } catch (error) {
      console.error("❌ Error in job search:", error);
      req.flash('error_msg', 'Something went wrong.');
      res.redirect('/jobs');
  }
});


module.exports = router;



