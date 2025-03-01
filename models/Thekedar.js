const mongoose = require("mongoose");

const projectsSchema = new mongoose.Schema(
    {
      thisProjectWorkers:{type:Array},
      originalJobId:String,    
      title: {type: String},
      isCompleted:{type:String,default:"no"},
      address: {type: String},
      pincode: {type:String},
      photo:{type:String},
      description:{type:String},
    },
    { timestamps: true }
  ); //timestamp true krn se created at , updated at , etc functionalities kaam krn lgti h

const ThekedarSchema = new mongoose.Schema(
  {
    name: {type: String , required:true },
    email:{type:String, required:true},
    mobile: {type: String, required:true},
    address: {type: String , required:true},
    pincode: {type:String, required:true},
    photo:{type:String, required:true},
    projects:[projectsSchema],
    workers:{type:Array},
    workTypes:Array,
  },
  { timestamps: true }
); 

const Thekedar = mongoose.model("Thekedar", ThekedarSchema);

module.exports = Thekedar;