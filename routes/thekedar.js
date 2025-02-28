const express = require("express");
const router = express.Router();
const User = require('../models/User');
const Thekedar = require('../models/Thekedar');
const Worker = require("../models/Worker");
const Certificate = require("../models/Certificates");


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

router.get('/thekedar', async (req, res) => {
    req.flash('error_msg', 'Hello Dear');
    const user = await User.findById(req.user.id);
    const thekedar = await Thekedar.findOne({email:user.email})
    res.render("thekedar/thekedarIndex.ejs",{thekedar});
  });

router.get('/thekedar/signup', (req, res) => {
  req.flash('error_msg', 'Hello Dear');
  res.render("./users/thekedarSignup.ejs");
});

router.post("/signup/thekedar", async (req, res, next) => {
    try {
      const { name, email, password, contactNumber, workType, address,pincode,photo } = req.body;
      const username = email
      const thekedar = new User({ name, email, username,role: "thekedar" });
      const newWorker = new Thekedar({
            name,
            mobile:contactNumber,
            address,
            pincode,
            photo,
            email,
            workTypes: workType.split(","),
            projects:[],
      })
      await newWorker.save();
      const registeredWorker = await User.register(thekedar, password);
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

router.get("/add/workers", async (req, res) => {
    try {
        const workers = await Worker.find();
        res.render('thekedar/addWorker.ejs',{workers})
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
  
  // ✅ Add selected worker to Thekedar's workers array
  router.post("/add/workers", async (req, res) => {
      try {
          const { workerId } = req.body;
          const id = req.user.id;
          const user = await User.findById(req.user.id);
          const mail = user.email
          const thekedar = await Thekedar.findOne({email:mail});

          if (!thekedar) {
              return res.status(404).json({ success: false, message: "Thekedar not found" });
          }
          if (thekedar.workers.includes(workerId)) {
              return res.status(400).json({ success: false, message: "Worker already added" });
          }
          thekedar.workers.push(workerId);
          await thekedar.save();
  
          res.json({ success: true, message: "Worker added successfully", thekedar });
  
      } catch (error) {
          res.status(500).json({ success: false, message: error.message });
      }
  });

  router.get("/thekedars", async (req, res) => {
    try {
        const thekedars = await Thekedar.find(); // Fetch all Thekedars

        if (!thekedars || thekedars.length === 0) {
            return res.status(404).json({ success: false, message: "No Thekedars found" });
        }

        res.render("thekedar/thekedarList", { thekedars }); // Render the EJS page
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/thekedar/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const thekedar = await Thekedar.findById(id);
        if (!thekedar) {
            return res.status(404).json({ success: false, message: "Thekedar not found" });
        }
        var workers = [];
        for(let i=0 ; i<thekedar.workers.length ;i++){
            const worker = await Worker.findById(thekedar.workers[i]);
            workers.push(worker);
        }
        res.render("thekedar/thekedarProfile", { thekedar,workers }); // Render EJS file
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// 🟢 Route to Render Projects Page
router.get("/show/thekedar/projects", async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
        }
        const user = await User.findById(req.user.id);
        console.log(user)
        const thekedar = await Thekedar.findOne({ email: user.email })
        res.render("thekedar/myProjects", { thekedar, projects: thekedar.projects });
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});


// 🟢 Route to Add a New Project
router.post("/thekedar/:id/projects/add", async (req, res) => {
    try {
        const { title, address, pincode, photo, description } = req.body;
        const thekedar = await Thekedar.findById(req.params.id);

        if (!thekedar) {
            return res.status(404).json({ success: false, message: "Thekedar not found" });
        }

        const newProject = {
            title,
            address,
            pincode,
            photo: photo || "https://via.placeholder.com/150", // Default image if none provided
            description,
            thisProjectWorkers: []
        };

        thekedar.projects.push(newProject);
        await thekedar.save();

        res.redirect(`/thekedar/${thekedar._id}/projects`);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

//change order status 


router.post("/change/order/status/:projectId/:thekedarId", async (req, res) => {
    try {
        const { projectId, thekedarId } = req.params;

        // ✅ Step 1: Find Thekedar and Update Project Status
        const updatedThekedar = await Thekedar.findOneAndUpdate(
            { _id: thekedarId, "projects._id": projectId },
            { $set: { "projects.$.isCompleted": "yes" } },
            { new: true, runValidators: true }
        );

        if (!updatedThekedar) {
            return res.status(404).json({ success: false, message: "Thekedar or Project not found" });
        }

        // ✅ Step 2: Find the Completed Project
        const project = updatedThekedar.projects.find(p => p._id.toString() === projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        // ✅ Step 3: Generate & Save Certificate for Thekedar
        const thekedarCertificate = new Certificate({
            workerId: thekedarId,  // Thekedar treated as workerId here
            name: updatedThekedar.name,
            postId: projectId,
            startingDate: project.createdAt,
            endingDate: new Date() // Completion date
        });

        await thekedarCertificate.save();

        // ✅ Step 4: Update Workers' Project History & Generate Their Certificates
        const workerIds = project.thisProjectWorkers;

        // Fetch worker details and create certificates
        const workerCertificates = await Promise.all(workerIds.map(async (workerId) => {
            const worker = await Worker.findById(workerId);
            if (!worker) return null; // Skip if worker not found

            // Add project details to worker's project history
            worker.projects.push(project);
            await worker.save();

            return {
                workerId,
                name: worker.name,
                postId: projectId,
                startingDate: project.createdAt,
                endingDate: new Date()
            };
        }));

        const validCertificates = workerCertificates.filter(cert => cert !== null);
        await Certificate.insertMany(validCertificates);
        res.status(200).json({
            success: true,
            message: "Project marked as completed, workers updated, and certificates generated",
            thekedarCertificate,
            workerCertificates: validCertificates
        });

    } catch (error) {
        console.error("Error updating project and generating certificates:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});


//Add Workers to the existing project
router.get("/edit/order/:projectId/:thekedarId", async (req, res) => {
    try {
        let { projectId, thekedarId } = req.params;
        thekedarId = thekedarId.replace(/^:/, ""); // Remove ":" at the start if present

        // Find Thekedar
        const thekedar = await Thekedar.findById(thekedarId);
        if (!thekedar) {
            return res.status(404).json({ success: false, message: "Thekedar not found" });
        }
        // ✅ Ensure `thekedar.workers` is not undefined
        if (!thekedar.workers || thekedar.workers.length === 0) {
            return res.status(404).json({ success: false, message: "No workers found for this Thekedar" });
        }
        // ✅ Fetch worker details using Promise.all() for efficiency
        const workers = await Promise.all(
            thekedar.workers.map(workerId => Worker.findById(workerId))
        );
        console.log(workers);
        res.render("thekedar/addWorkerToProject.ejs", { workers,thekedarId,projectId });

    } catch (error) {
        console.error("Error fetching workers:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

  
  // ✅ Add selected worker to Thekedar's workers array
  router.post("/add/workers/to/project/:thekedarId/:projectId", async (req, res) => {
    try {
        const { thekedarId, projectId } = req.params;
        const workerIds = Array.isArray(req.body.workerIds) ? req.body.workerIds : [req.body.workerIds]; // Ensure array

        const thekedar = await Thekedar.findOneAndUpdate(
            { _id: thekedarId, "projects._id": projectId },
            { $push: { "projects.$.thisProjectWorkers": { $each: workerIds } } },
            { new: true }
        );

        if (!thekedar) return res.status(404).json({ success: false, message: "Thekedar or Project not found" });

        res.redirect(`/some/success/page`);
    } catch (error) {
        console.error("Error adding workers:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});




module.exports = router;



