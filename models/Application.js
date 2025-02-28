const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
    appliedAt: { type: Date, default: Date.now },
  }
);

module.exports = mongoose.model("Application", ApplicationSchema);
