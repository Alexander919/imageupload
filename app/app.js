if(process.env.NODE_ENV !== "production")
    require("dotenv").config();

const { ApplicationError, handleError } = require("./helpers/error");
const { flash, requireSignIn, loggedInUser } = require("./helpers/middleware");

const express = require("express");
const mongoose = require("mongoose");
const ejs_mate = require("ejs-mate");
const { body, validationResult } = require('express-validator');

//auth
const cookieSession = require("cookie-session");
//image upload and storage
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
//Image Schema
const Image = require("./models/image");
const Memory = require("./models/memory");

const authRouter = require("./routes/auth");
const memoryRouter = require("./routes/memory");

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

//const test_storage = multer.memoryStorage();
//const mem_upload = multer({ test_storage });

//MongoDB setup
main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://databaseserver:27017/imageupload');
    console.log("Database connected.");
}

const app = express();
//setup some variables used in templates throughout the app
app.locals.loggedInUser = null;
app.locals.errors = null;

app.locals.helpers = { 
    getErrorForField: (errors, field) => {
        let stringErr = ""
        if(errors && errors.constructor.name === "Result") {
            const err = errors.mapped()[field];
            stringErr = (err && err.msg) || stringErr;
        }
        return stringErr;
    }
};
/////////////////////////////////////////////////////////

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

app.use(loggedInUser);
app.use(flash("success", "failure", "error"));


app.set("view engine", "ejs");
app.engine("ejs", ejs_mate);


//app.use((req, res, next) => {
//    console.log(req.session);
//    next();
//});

app.use(authRouter);
app.use(memoryRouter);

app.get("/home", (req, res) => {
    res.send("Home");
});

//testing
//TODO: query string to find next 10 memories
app.get("/test", handleError(async (req, res, next) => {
    const memories = await Memory.find({ isPrivate: false }).populate("author");
    //TODO: promisify
    //res.render("test", { memories }, (err, html) => {
    //    //console.log(err);
    //    console.log(html);
    //});
    res.render("test", { memories });
}));
app.post("/test", body("myinput").not().isEmpty().bail().withMessage("is empty").trim().escape().isLength({ min: 5 }).withMessage("my message"), (req, res) => {
    console.log(validationResult(req));
    console.log(req.body);
    res.send("OK");
});


app.get("/", handleError(async (req, res) => {
    const images = await Image.find({});

    res.render("index", { images });
}));

app.get("/upload", requireSignIn, (req, res) => {
    res.render("upload");
});

app.post("/upload", upload.array("images"), handleError(async (req, res) => {
    const images = req.files.map(({ path, originalname, size, filename }) => ({ path, originalname, size, filename }));
    await Image.insertMany(images);

    req.flash("success", "Images uploaded!");
    res.send({ redirect: "/" });
}));

app.get("/edit", requireSignIn, handleError(async (req, res) => {
    const images = await Image.find({});
    res.render("edit", { images });
}));

//update route
app.post("/edit", upload.array("images"), handleError(async (req, res) => {
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

    req.flash("success", "Updated successfully!");
    res.send({ redirect: "/" });
}));

//all other routes
app.all('*', (req, res, next) => {
    next(new ApplicationError('Could not find resource', 404));
});

//error handler
app.use((err, req, res, next) => {
    console.log("in error handler");
    const { status=500 } = err;
    if (!err.message) 
        err.message = "Generic error message";

    res.status(status).render("error", { err, status })
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});