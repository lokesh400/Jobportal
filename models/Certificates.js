const mongoose = require("mongoose");

const CertificateSchema = new mongoose.Schema(
  {
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    name:String,
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    startingDate: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
    endingDate: { type: Date, default: Date.now },
  }
);

module.exports = mongoose.model("Certificate", CertificateSchema);
