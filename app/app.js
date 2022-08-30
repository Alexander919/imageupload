if(process.env.NODE_ENV !== "prod")
    require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const ejs_mate = require("ejs-mate");

//const bcrypt = require("bcrypt");

//auth
const cookieSession = require("cookie-session");
//image upload and storage
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
//Image Schema
const Image = require("./models/image");
//User Schema
const User = require("./models/user");

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ImageUpload",
    format: async (req, file) => 'jpg', // supports promises as well
    //public_id: (req, file) => 'computed-filename-using-request',
  }
});
const upload = multer({ storage });


const test_storage = multer.memoryStorage();
const mem_upload = multer({ test_storage });





//MongoDB setup
main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://databaseserver:27017/imageupload');
    console.log("Database connected.");
    //const photo = new Image({ name: 'kitten.jpg', url: "https://unsplash.com/photos/vCSz54kStV4" });
    //await photo.save();
}
const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
    name: "session",
    keys: ["my secret key", "my other secret key"],
    maxAge: 1000 * 60 * 60 * 24 * 7, //expires in a week
    httpOnly: true,
    signed: true,
    overwrite: true
}));

app.use(async (req, res, next) => {
    if(req.session.userId) {
        const { username, email } = await User.findById(req.session.userId);
        res.locals.user = { username, email };
        console.log(username);
    }
    next();
});

async function requireSignIn(req, res, next) {
    if(!req.session.userId) {
        req.session.rememberedURL = req.originalUrl;
        return res.redirect("/signin");
    }
    const loggedInUser = await User.findById(req.session.userId);

    if(!loggedInUser) {
        console.log("Internal error");
        return res.redirect("/");
    }
    req.body.loggedInUser = loggedInUser;
    next();
}

app.set("view engine", "ejs");
app.engine("ejs", ejs_mate);

//TODO: input validators

app.get("/home", (req, res) => {
    res.send("Home");
});

//testing
app.get("/test", requireSignIn, async (req, res) => {
    console.log(req.body);
    console.log(req.session);
    res.render("test");
});
app.get("/signout", (req, res) => {
    req.session = null;
    res.redirect("/");
});

app.get("/signin", async (req, res) => {
    console.log(req.session);
    res.render("signin");
});
app.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    //static method in models/user.js
    const user = await User.findByEmailAndAuth(email, password);

    if(user) {
        req.session.userId = user._id;
        const returnTo = req.session.rememberedURL;
        return res.redirect(returnTo ? returnTo : "/");
    }

    //authentication failed
    res.redirect("/signin", { err: "auth"});
});

app.get("/register", async (req, res) => {
    res.render("register");
});
app.post("/register", async (req, res) => {
    //TODO: check if passwords match
    const { username, email, password, confirm } = req.body;
    //static method in models/user.js
    const newUser = await User.hashAndRegister(username, email, password);

    if(!newUser) {
        //failed to create user
        console.log("Failed to create user");
        return res.redirect("/register", { err: "register"});
    }
    console.log(newUser)
    req.session.userId = newUser._id;

    res.redirect("/");
});
//app.get("/gethtml", (req, res) => {
//    res.render("gethtml", { heading: "This is my heading"});
//});
//app.post("/test", mem_upload.array("test_images"), (req, res) => {
//    console.log(req.body);
//    console.log(req.files);
//    res.send({ redirect: "/test" });
//});
//testing

app.get("/", async (req, res) => {
    console.log(res.locals);
    const images = await Image.find({});
    //console.log(images);
    res.render("index", { images });
});

app.get("/upload", (req, res) => {
    res.render("upload");
});

app.post("/upload", upload.array("images"), async (req, res) => {
    const images = req.files.map(({ path, originalname, size, filename }) => ({ path, originalname, size, filename }));
    await Image.insertMany(images);

    //console.log(image);
    //console.log(req.body);
    //console.log(req.files);
    res.send({ redirect: "/" });
});

app.get("/edit", requireSignIn, async (req, res) => {
    const images = await Image.find({});
    res.render("edit", { images });
});

//update route
app.post("/edit", upload.array("images"), async (req, res) => {
    const uploaded = req.files.map(({ path, originalname, size, filename }) => ({ path, originalname, size, filename }));
    await Image.insertMany(uploaded);
    //campground.updateOne({ $pull: { images: { filename: { $in: req.body.delete }}}});
    //forEach does NOT wait on promises!!
    if(req.body.delete) {
        for(filename of req.body.delete) {
            cloudinary.uploader.destroy(filename);
            await Image.findOneAndDelete({ filename });
        }
    }
    console.log(req.body);
    res.send({ redirect: "/" });
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});