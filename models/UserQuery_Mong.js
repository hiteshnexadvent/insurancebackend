const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({ name: { type: String, required: true }, email: { type: String, required: true }, mobile: { type: String, required: true }, city: { type: String, required: true }, message: { type: String, required: true } }, { timestamps: true });

const userMong = mongoose.model('users', userSchema);

module.exports = userMong;