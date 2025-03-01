const mongoose = require("mongoose");
const CertificateSchema = new mongoose.Schema({
    workerId: { type: String, required: true },
    name: { type: String },
    postId: { type: String, required: true },
    startingDate: { type: Date, required: true },
    endingDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Certificate", CertificateSchema);
