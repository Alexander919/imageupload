const mongoose = require("mongoose");

//const imageSchema = new mongoose.Schema({
//    user: String,
//    images: [
//        {
//            path: String,
//            filename: String,
//            originalname: String,
//            size: Number
//        }
//    ]
//});
const imageSchema = new mongoose.Schema({
    path: String,
    filename: String,
    originalname: String,
    size: Number
});

imageSchema.virtual("preview").get(function() {
    return this.path.replace("/upload", "/upload/h_100");
});

module.exports = mongoose.model('Image', imageSchema);