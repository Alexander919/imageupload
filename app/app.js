if(process.env.NODE_ENV !== "production")
    require("dotenv").config();

const { ApplicationError, handleError } = require("./helpers/error");
const { flash, requireSignIn, loggedInUser } = require("./helpers/middleware");

const express = require("express");
const mongoose = require("mongoose");
const ejs_mate = require("ejs-mate");
//const { body, validationResult } = require('express-validator');

//auth
const cookieSession = require("cookie-session");
//Image Schema
const Image = require("./models/image");
const Memory = require("./models/memory");

const authRouter = require("./routes/auth");
const memoryRouter = require("./routes/memory");

//const { multer_upload_cloud } = require("./multercloud");
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
    overwrite: true,
    //sameSite: "strict"
}));

app.use(loggedInUser);
app.use(flash("success", "failure", "error"));


app.set("view engine", "ejs");
app.engine("ejs", ejs_mate);

app.use(authRouter);
app.use(memoryRouter);

app.get("/home", (req, res) => {
    res.send("Home");
});

//TODO: query string to find next 10 memories
app.get("/", handleError(async (req, res, next) => {
    const date = req.query.created ? new Date(req.query.created) : new Date();

    console.log(date);
    const sort = { $sort: { created: -1 } };
    const match = { $match: { isPrivate: false, created: { $lt: date } } };
    const limit = { $limit: 2 };
    const lookup = { $lookup: {
        from: "users",
        localField: "author",
        foreignField: "_id",
        as: "author"
    }};
    const unwind = { $unwind: "$author" };
    const project = { $project: {
        id: 1,
        title: 1,
        text: 1,
        isPrivate: 1,
        created: { $dateToString: { date: "$created" } },// defaults to ISOString
        "author.username": 1
    }};

    const pipe = Memory.aggregate([ sort, match, limit, lookup, unwind, project ]);
    const memories = await pipe.exec();
    console.log(memories);

    if(req.query.created) {
        return res.send({ memories });
    }

    res.render("index", { memories });
}));

//app.post("/test", body("myinput").not().isEmpty().bail().withMessage("is empty").trim().escape().isLength({ min: 5 }).withMessage("my message"), (req, res) => {
//    console.log(validationResult(req));
//    console.log(req.body);
//    res.send("OK");
//});


//app.get("/", handleError(async (req, res) => {
//    const images = await Image.find({});
//
//    res.render("index", { images });
//}));

//app.get("/upload", requireSignIn, (req, res) => {
//    res.render("upload");
//});
//
//app.post("/upload", multer_upload_cloud.array("images"), handleError(async (req, res) => {
//    console.log(req.files);
//    const images = req.files.map(({ path, originalname, size, filename }) => ({ path, originalname, size, filename }));
//    await Image.insertMany(images);
//
//    //req.flash("success", "Images uploaded!");
//    res.send({ redirect: "/" });
//}));
//
//app.get("/edit", requireSignIn, handleError(async (req, res) => {
//    const images = await Image.find({});
//    res.render("edit", { images });
//}));
//
////update route
//app.post("/edit", multer_upload_cloud.array("images"), handleError(async (req, res) => {
//    const uploaded = req.files.map(({ path, originalname, size, filename }) => ({ path, originalname, size, filename }));
//    await Image.insertMany(uploaded);
//    //campground.updateOne({ $pull: { images: { filename: { $in: req.body.delete }}}});
//    //forEach does NOT wait on promises!!
//    if(req.body.delete) {
//        for(filename of req.body.delete) {
//            cloudinary.uploader.destroy(filename);
//            await Image.findOneAndDelete({ filename });
//        }
//    }
//
//    req.flash("success", "Updated successfully!");
//    res.send({ redirect: "/" });
//}));

//all other routes
app.all("*", (req, res, next) => {
    next(new ApplicationError("Could not find resource", 404));
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