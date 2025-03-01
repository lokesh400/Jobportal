const mongoose = require("mongoose");

const projectsSchema = new mongoose.Schema(
    {
      originalJobId:String,  
      title: {type: String },
      address: {type: String },
      pincode: {type:String },
      photo:{type:String },
      description:{type:String },
    },
    { timestamps: true }
  ); //timestamp true krn se created at , updated at , etc functionalities kaam krn lgti h

const WorkerSchema = new mongoose.Schema(
  {
    name: {type: String },
    email:{type:String, required:true},
    mobile: {type: String },
    address: {type: String },
    pincode: {type:String },
    photo:{type:String },
    projects:[projectsSchema],
    skills:Array,
  },
  { timestamps: true }
); //timestamp true krn se created at , updated at , etc functionalities kaam krn lgti h

const Worker = mongoose.model("Worker", WorkerSchema);

module.exports = Worker;
