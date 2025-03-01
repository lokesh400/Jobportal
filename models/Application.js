const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    workerId: { type: String },
    jobId: { type: String },
    status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
    appliedAt: { type: Date, default: Date.now },
  }
);

module.exports = mongoose.model("Application", ApplicationSchema);
