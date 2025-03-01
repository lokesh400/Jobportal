const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    employerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    pincode: { type: String, required: true },
    address:{ type:String },
    location: {
        type: { type: String, default: "Point" },
        coordinates: { type: [Number], index: "2dsphere" } // [longitude, latitude]
    }
});

module.exports = mongoose.model("Job", jobSchema);
