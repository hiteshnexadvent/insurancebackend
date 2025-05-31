const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({ image: { type: String, required: true } });

const coverimagemong = mongoose.model('coverimages', blogSchema);

module.exports = coverimagemong;