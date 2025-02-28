const mongoose = require("mongoose");

const employerSchema = new mongoose.Schema(
  {
    name: {type: String , required:true },
    email:{type:String, required:true},
    mobile: {type: String, required:true},
    address: {type: String , required:true},
    pincode: {type:String, required:true},
    photo:{type:String, required:true},
    company:{type:String, required:true},
    jobs:[],
  },
  { timestamps: true }
); //timestamp true krn se created at , updated at , etc functionalities kaam krn lgti h

const Employer = mongoose.model("Employer", employerSchema);

module.exports = Employer;