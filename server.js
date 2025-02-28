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
// const io = socketIo(server);

// const onlineUsers = {};

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const upload = multer({ dest: "uploads/" });
const fs = require("fs");
const { error } = require("console");

const sessionOptions = require("./config/sessionConfig");


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


// Home route
app.get("/", async (req, res) => {
  try {
    const information = await Information.findOne();
    const result = await Result.find();
    const team = await Team.find();
    const calendarUpdates = Object.fromEntries(information.updates.calendar);
    res.render("index", { information, calendarUpdates, result, team });
  } catch (error) {
    console.log(error);
  }
});



// Start server
server.listen(777, () => console.log("Server running on http://localhost:777"));
