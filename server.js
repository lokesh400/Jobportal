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

const User = require("./models/User");
const Job = require("./models/Job");
const Message = require("./models/Message"); // Ensure the correct path

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

const userrouter = require("./routes/user.js");
const workerrouter = require("./routes/worker.js");
const employerrouter = require("./routes/employer.js");
const thekedarrouter = require("./routes/thekedar.js");

app.use("/", userrouter);
app.use("/", workerrouter);
app.use("/", employerrouter);
app.use("/", thekedarrouter);


// Home route
app.get("/", async (req, res) => {
  try {
    const jobs = await Job.find();
    res.render("index",{jobs});
  } catch (error) {
    console.log(error);
  }
});

// Chat Page
const users = new Map();
app.get("/chat", async (req, res) => {
  const users = await User.find();
  res.render("chats/chat.ejs", { users, user: req.user });
});

// Get Previous Messages
app.get("/messages/:recipient", async (req, res) => {
  if (!req.isAuthenticated())
    return res.status(401).json({ error: "Unauthorized" });
  const { recipient } = req.params;
  const sender = req.user.username;
  try {
    const messages = await Message.find({
      $or: [
        { sender: sender, recipient: recipient },
        { sender: recipient, recipient: sender },
      ],
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Error loading messages" });
  }
});

// WebSocket Connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Store user in online users map
  socket.on("userConnected", (username) => {
    users.set(username, socket.id);
    console.log(`${username} is now online`);
  });

  // Private Messaging
  socket.on("privateMessage", async ({ sender, recipient, message }) => {
    const newMessage = new Message({ sender, recipient, content: message });
    await newMessage.save();

    console.log(`Message from ${sender} to ${recipient}: ${message}`);

    // Send message to sender
    io.to(users.get(sender)).emit("newMessage", { sender, message });

    // Send message to recipient if online
    if (users.has(recipient)) {
      io.to(users.get(recipient)).emit("newMessage", { sender, message });
    }
  });

  // Handle User Disconnect
  socket.on("disconnect", () => {
    for (let [username, id] of users.entries()) {
      if (id === socket.id) {
        users.delete(username);
        console.log(`${username} disconnected`);
        break;
      }
    }
  });
});

// Start server
server.listen(777, () => console.log("Server running on http://localhost:777"));
