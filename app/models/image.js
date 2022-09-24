const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
    //author: {
    //    type: mongoose.Schema.Types.ObjectId,
    //    ref: "User"
    //},
    path: String,
    filename: String,
    originalname: String,
    size: Number
});

imageSchema.virtual("preview").get(function() {
    return this.path.replace("/upload", "/upload/h_100");
});

module.exports = mongoose.model('Image', imageSchema);