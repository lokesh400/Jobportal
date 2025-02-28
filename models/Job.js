const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    employerId: { type:String },
    location: { type: String, required: true },
    pincode: {type:String},
    assigned: {type:String,default:"no"},
    assignedTo : {type:String}
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", JobSchema);
