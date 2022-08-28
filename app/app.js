if(process.env.NODE_ENV !== "prod")
    require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const ejs_mate = require("ejs-mate");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const Image = require("./models/image");

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
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.engine("ejs", ejs_mate);
app.use(express.static('public'));


app.get("/test", (req, res) => {
    res.render("test");
});
app.post("/test", mem_upload.array("test_images"), (req, res) => {
    console.log(req.files);
    res.end();
});


app.get("/", async (req, res) => {
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

app.get("/edit", async (req, res) => {
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

//app.post("/", async (req, res, next) => {
//    upload.array("images")(req, res, next);
//    await res.render("loading");
//}, async (req, res) => {
//    console.log(req.files);
//    console.log(req.body);
//    await res.render("index");
//});


app.listen(3000, () => {
    console.log("Server is running on port 3000");
});