const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({ name: { type: String, required: true }, review: { type: String, required: true }, image: { type: String, required: true } }, { timestamps: true });

const reviewMong = mongoose.model('reviews', reviewSchema);

module.exports = reviewMong;