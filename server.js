require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const methodOverride = require("method-override");
const { jsPDF } = require("jspdf");

const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const onlineUsers = {};

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const upload = multer({ dest: "uploads/" });
const fs = require("fs");
const { error } = require("console");

const sessionOptions = require("./config/sessionConfig");

// const Student = require("./models/Student");
const User = require("./models/User");
// const Enquiry = require("./models/Enquiry");
// const Information = require("./models/Information");
// const Result = require("./models/Result");
// const Team = require("./models/Team");
// const Class = require("./models/Class");
// const Teacher = require("./models/Teacher");
// const Message = require("./models/Message"); // Ensure the correct path

// Connect to MongoDB
mongoose
  .connect(process.env.mongo_url)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.set("view engine", "ejs");
// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(express.json());
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.currUser = req.user;
  next();
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/user/login");
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.render("./error/accessdenied.ejs");
}

// const studentRoutes = require("./routes/studentRoutes");
// const teacherRoutes = require("./routes/teacherRoutes");
// const adminRoutes = require("./routes/admin");
const userrouter = require("./routes/user.js");
// const courserouter = require("./routes/courses.js");
// const examrouter = require("./routes/exam.js");
// const quizrouter = require("./routes/quiz.js");
// const otprouter = require("./routes/otp.js");
// const chatsrouter = require("./routes/chats.js");

// app.use("/", studentRoutes);
// app.use("/", teacherRoutes);
// app.use("/", adminRoutes);
app.use("/", userrouter);
// app.use("/", courserouter);
// app.use("/", examrouter);
// app.use("/", quizrouter);
// app.use("/user", otprouter);
// app.use("/", chatsrouter);

// Home route
app.get("/", async (req, res) => {
  try {
    // const information = await Information.findOne();
    // const result = await Result.find();
    // const team = await Team.find();
    // const calendarUpdates = Object.fromEntries(information.updates.calendar);
    res.render("index");
  } catch (error) {
    console.log(error);
  }
});

// Chat Page
// const users = new Map();
// app.get("/chat", async (req, res) => {
//   const users = await User.find();
//   res.render("chats/chat.ejs", { users, user: req.user });
// });

// // Get Previous Messages
// app.get("/messages/:recipient", async (req, res) => {
//   if (!req.isAuthenticated())
//     return res.status(401).json({ error: "Unauthorized" });
//   const { recipient } = req.params;
//   const sender = req.user.username;
//   try {
//     const messages = await Message.find({
//       $or: [
//         { sender: sender, recipient: recipient },
//         { sender: recipient, recipient: sender },
//       ],
//     }).sort({ timestamp: 1 });
//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ error: "Error loading messages" });
//   }
// });

// // WebSocket Connection
// io.on("connection", (socket) => {
//   console.log("A user connected:", socket.id);

//   // Store user in online users map
//   socket.on("userConnected", (username) => {
//     users.set(username, socket.id);
//     console.log(`${username} is now online`);
//   });

//   // Private Messaging
//   socket.on("privateMessage", async ({ sender, recipient, message }) => {
//     const newMessage = new Message({ sender, recipient, content: message });
//     await newMessage.save();

//     console.log(`Message from ${sender} to ${recipient}: ${message}`);

//     // Send message to sender
//     io.to(users.get(sender)).emit("newMessage", { sender, message });

//     // Send message to recipient if online
//     if (users.has(recipient)) {
//       io.to(users.get(recipient)).emit("newMessage", { sender, message });
//     }
//   });

//   // Handle User Disconnect
//   socket.on("disconnect", () => {
//     for (let [username, id] of users.entries()) {
//       if (id === socket.id) {
//         users.delete(username);
//         console.log(`${username} disconnected`);
//         break;
//       }
//     }
//   });
// });

// app.get("/admin", async (req, res) => {
//   res.render("adminIndex");
// });

// app.get("/about", (req, res) => {
//   res.render("about", { title: "About Page" });
// });

// app.post("/add/new/enquiry", async (req, res) => {
//   try {
//     const { name, message, number } = req.body;
//     const newEnquiry = new Enquiry({
//       name,
//       number,
//       message,
//     });
//     await newEnquiry.save();
//     req.flash("success_msg", "enquiry generated successfully");
//     res.redirect("/");
//   } catch (error) {
//     console.log(error);
//   }
// });

// //Admit Card

// app.get("/admitcard", async (req, res) => {
//   res.render("admitCard");
// });

// app.post("/add/new/class", async (req, res) => {
//   try {
//     const newClass = new Class(req.body);
//     await newClass.save();
//     res.status(201).json(newClass);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

// app.get("/all/classes", async (req, res) => {
//   try {
//     const classes = await Class.find();
//     res.render("teacher/allClasses.ejs", { classes });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// app.get("/add/new/class", async (req, res) => {
//   res.render("teacher/addClass.ejs");
// });

// app.get("/show/this/class/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const thisClass = await Class.findById(id);
//     const grade = thisClass.title;
//     const students = await Student.find({ studentClass: grade });
//     const teachers = await Teacher.find();
//     res.render("teacher/thisClass.ejs", { thisClass, students, teachers });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// app.post("/assign-coordinator/:classId", async (req, res) => {
//   try {
//       const { classId } = req.params;
//       const { coordinatorId } = req.body;
//       await Class.findByIdAndUpdate(classId, { coordinator: coordinatorId });
//       res.redirect(`/show/this/class/${classId}`);
//   } catch (error) {
//       res.status(500).send(error.message);
//   }
// });

// // Add Teachers (Multiple Allowed)
// app.post("/add-teachers/:classId", async (req, res) => {
//   try {
//       const { classId } = req.params;
//       let { teacherIds } = req.body;
//       teacherIds = Array.isArray(teacherIds) ? teacherIds : [teacherIds];

//       await Class.findByIdAndUpdate(classId, { $push: { teachers: { $each: teacherIds } } });
//       res.redirect(`/show/this/class/${classId}`);
//   } catch (error) {
//       res.status(500).send(error.message);
//   }
// });

// Start server
server.listen(777, () => console.log("Server running on http://localhost:777"));
