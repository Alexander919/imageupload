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

//https://stackoverflow.com/questions/14348516/cascade-style-delete-in-mongoose
//clientSchema.pre('remove', function(next) {
//    // 'this' is the client being removed. Provide callbacks here if you want
//    // to be notified of the calls' result.
//    Sweepstakes.remove({client_id: this._id}).exec();
//    Submission.remove({client_id: this._id}).exec();
//    next();
//});
module.exports = mongoose.model("Memory", memorySchema);