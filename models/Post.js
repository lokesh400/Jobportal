const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    title: {type: String , required:true },
    description: {type: String, required:true},
    postedBy: {type: String , required:true},
    photo: {type:String, required:true},
    address:{type:String, required:true},
    pincode:{type:String, required:true},
  },
  { timestamps: true }
); //timestamp true krn se created at , updated at , etc functionalities kaam krn lgti h

const Post = mongoose.model("Post", PostSchema);
module.exports = Post;