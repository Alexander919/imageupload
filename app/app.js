if(process.env.NODE_ENV !== "prod")
    require("dotenv").config();

const { ApplicationError } = require("./helpers/error");

const express = require("express");
const mongoose = require("mongoose");
const ejs_mate = require("ejs-mate");
const { body, validationResult } = require('express-validator');

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

app.locals.helpers = { 
    getErrorForField: function(errors, field) {
        let stringErr = ""
        if(errors.constructor.name === "Result") {
            const err = errors.mapped()[field];
            stringErr = (err && err.msg) || stringErr;
        }
        return stringErr;
    }
};
app.locals.error = { empty: true };

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
    res.locals.loggedInUser = null;

    if(req.session.userId) {
        const user = await User.findById(req.session.userId);
        if(user) {
            res.locals.loggedInUser = user;
            //console.log(username);
        } else { //client has a cookie with userId but not the database
            req.session = null;
        }
    }
    next();
});

async function requireSignIn(req, res, next) {
    if(!req.session.userId) {
        req.session.rememberedURL = req.originalUrl; //remember the page to return to
        return res.redirect("/signin");
    }
    //const loggedInUser = await User.findById(req.session.userId);

    //if(!loggedInUser) {
    //    console.log("Internal error");
    //    return res.redirect("/");
    //}
    //req.body.loggedInUser = loggedInUser;
    next();
}

app.set("view engine", "ejs");
app.engine("ejs", ejs_mate);

//TODO: input validators

app.get("/home", (req, res) => {
    res.send("Home");
});

function handleError(fn) {
    return async function(req, res, next) {
        try {
            await fn(req, res, next);
        } catch(err) {
            return next(err);
        }
    }
}
//testing
app.get("/test", handleError(async (req, res, next) => {
    //console.log(req.body);
    //console.log(req.session);
    //throw new ApplicationError("what a fuck", 404);
    res.render("test");
}));
app.post("/test", body("myinput").not().isEmpty().bail().withMessage("is empty").trim().escape().isLength({ min: 5 }).withMessage("my message"), (req, res) => {
    console.log(validationResult(req));
    console.log(req.body);
    res.send("OK");
});


app.get("/signout", (req, res) => {
    req.session = null;
    res.redirect("/");
});

app.get("/signin", (req, res) => {
    //console.log(req.session);
    res.render("signin");
});

const validate = validations => {
    return async (req, res, next) => {
        for (let val of validations) {
            const result = await val.run(req);
            //stop all validations is there is an error anywhere
            if (result.errors.length) {
                break;
            }
        }

        const error = validationResult(req);
        if (error.isEmpty()) { //no error
            return next();
        }

        return res.render("signin", { error });
    };
};
app.post("/signin", 
    validate([
        body("email").trim().notEmpty().withMessage("Email field can't be empty").bail().normalizeEmail().isEmail().withMessage("Not a valid email"),

        body("password").trim().notEmpty().withMessage("Please provide a password").bail().custom(async (value, { req, location, path }) => {
            const { email, password } = req.body;
            //static method in models/user.js
            const user = await User.findByEmailAndAuth(email, password);

            if(!user) {
                //authentication failed
                throw new Error("Authentication failed");
            }

            req.session.userId = user._id;
            return true;
        })
    ]),
    handleError(async (req, res) => {
        //const { email, password } = req.body;
        ////static method in models/user.js
        //const user = await User.findByEmailAndAuth(email, password);

        //if(!user) {
        //    //authentication failed
        //    return res.render("signin", { err: "auth" });
        //}
        //const result = validationResult(req);
        //console.log(result);

        //if(!result.isEmpty()) {
        //    return res.render("signin", { result });
        //}
        console.log("Success");
        const returnTo = req.session.rememberedURL;

        res.redirect(returnTo ? returnTo : "/");
}));

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", handleError(async (req, res) => {
    //TODO: check if passwords match
    const { username, email, password, confirm } = req.body;
    //static method in models/user.js
    const newUser = await User.hashPasswordAndCreate(username, email, password);

    if(!newUser) {
        //failed to create user
        console.log("Failed to create user");
        return res.redirect("/register", { err: "register"});
    }
    console.log(newUser)
    req.session.userId = newUser._id;

    res.redirect("/");
}));
//app.get("/gethtml", (req, res) => {
//    res.render("gethtml", { heading: "This is my heading"});
//});
//app.post("/test", mem_upload.array("test_images"), (req, res) => {
//    console.log(req.body);
//    console.log(req.files);
//    res.send({ redirect: "/test" });
//});
//testing

app.get("/", handleError(async (req, res) => {
    //console.log(res.locals);
    const images = await Image.find({});
    //console.log(images);
    res.render("index", { images });
}));

app.get("/upload", (req, res) => {
    res.render("upload");
});

app.post("/upload", upload.array("images"), handleError(async (req, res) => {
    const images = req.files.map(({ path, originalname, size, filename }) => ({ path, originalname, size, filename }));
    await Image.insertMany(images);

    //console.log(image);
    //console.log(req.body);
    //console.log(req.files);
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
    console.log(req.body);
    res.send({ redirect: "/" });
}));

//all other routes
app.all('*', (req, res, next) => {
    next(new ApplicationError('Could not find resource', 404));
});

//error handler
//app.use(err, (req, res) => ...)
app.use((err, req, res, next) => {
    console.log("in handler");
    const { status=500 } = err;
    if (!err.message) 
        err.message = "Generic error message";

    res.status(status).render("error", { err, status })
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});