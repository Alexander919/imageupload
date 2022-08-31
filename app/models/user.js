const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "username is required"],
        unique: true
    },
    email: {
        type: String,
        required: [true, "email is required"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "password is required"]
    }
});

userSchema.statics.findByEmailAndAuth = async function(email, password) {
    console.log("I AM RUNNING");
    const user = await this.findOne({ email });
    if(user) {
        const isEqual = await bcrypt.compare(password, user.password);
        if(isEqual) return user;
    }
    return null;
};

userSchema.statics.hashPasswordAndCreate = async function(username, email, password) {
    try {
        const hashedPasswd = await bcrypt.hash(password, 14);
        const newUser = await this.create({
            username, email, password: hashedPasswd
        });
        return newUser;

    } catch(e) {
        return null;
    }
}

module.exports = mongoose.model("User", userSchema);