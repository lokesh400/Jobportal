const mongoose = require("mongoose");
const CertificateSchema = new mongoose.Schema({
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    name: { type: String },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    startingDate: { type: Date, required: true }, // Change to Date type
    endingDate: { type: Date, default: Date.now }
});


module.exports = mongoose.model("Certificate", CertificateSchema);
