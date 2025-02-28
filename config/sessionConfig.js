const session = require("express-session");
const MongoStore = require("connect-mongo");
require("dotenv").config(); // Ensure environment variables are loaded

const store = MongoStore.create({
  mongoUrl: process.env.mongo_url,
  crypto: {
    secret: process.env.secret,
  },
  touchAfter: 24 * 3600, // Reduce write operations
});

store.on("error", (error) => {
  console.log("Error in connecting Mongo session store:", error);
});

const sessionOptions = {
  store,
  secret: process.env.secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days expiry
    maxAge: 3 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

module.exports = sessionOptions;