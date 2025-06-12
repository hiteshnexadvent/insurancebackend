const mongoose = require("mongoose");

const schSchema = new mongoose.Schema({
    date: { type: String, required: true },
    time: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String, required: true },
    city: { type: String, required: true }
  
});

const scheduleMong = mongoose.model("schedule", schSchema);

module.exports = scheduleMong;
