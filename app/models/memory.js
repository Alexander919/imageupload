const mongoose = require("mongoose");

const memorySchema = new mongoose.Schema({
    title: String,
    text: String,
    isPrivate: Boolean,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    gallery: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Image"
        }
    ],
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Memory", memorySchema);