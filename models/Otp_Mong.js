const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5 min expiry
});

const otpMong= mongoose.model('Otp', otpSchema);

module.exports = otpMong;