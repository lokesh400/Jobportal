const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employer", required: true },
    salary: { type: Number, required: true },
    location: { type: String, required: true },
    duration: { type: String, enum: ["Full-time", "Part-time", "Contract"], required: true },
    requiredSkills: { type: [String], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", JobSchema);
