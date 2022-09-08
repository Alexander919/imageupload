const express = require("express");
const router = express.Router();
const Memory = require("../models/memory");
const Image = require("../models/image");

const { body, validationResult } = require('express-validator');
const { checkValidationErrors } = require("../helpers/validation");
const { requireSignIn } = require("../helpers/middleware");

//image upload and storage
const multer = require("multer");
const streamifier = require("streamifier");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

//const storage = new CloudinaryStorage({
//  cloudinary,
//  params: {
//    folder: "ImageUpload",
//    format: async (req, file) => 'jpg', // supports promises as well
//    //public_id: (req, file) => 'computed-filename-using-request',
//  }
//});

const storage = multer.memoryStorage();
//TODO: store images locally or in memory; do the validations then upload to cloudinary
const upload = multer({ storage });

async function upload_file(file) {
    return new Promise((resolve, reject) => {
        const upload_stream = cloudinary.uploader.upload_stream({ 
            folder: "memoryUploadTest", 
            format: "jpg", 
            filename_override: file.originalname 
        }, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
        });
        streamifier.createReadStream(file.buffer).pipe(upload_stream);
    });
}

async function uploadArrayFromMem(files) {
    const uploaded = files.map(file => upload_file(file));
    return Promise.all(uploaded);
}


router.get("/memory/show/:id", async (req, res) => {
    const id = req.params.id;
    const memory = await Memory.findById(id).populate("gallery");

    if(memory.isPrivate && !memory.author.equals(req.user._id)) {
        req.flash("error", "Error. No permission to view.");
        return res.redirect("/");
    }
    //console.log(memory);
    res.render("memory/show", { memory });
});


router.get("/memory/new", requireSignIn, (req, res) => {
    res.render("memory/new");
});

router.post("/memory/new", requireSignIn,
    upload.array("images"), //store files temporarily in memory(check validation before uploading to the cloud)
    body("title").trim().notEmpty().bail().withMessage("Title field must not be empty").escape().isLength({ min: 2, max: 50 }).withMessage("Length of title must be in range between 2 - 50 characters"),
    body("text").trim().escape(),
    checkValidationErrors("memory/new"),
    async (req, res) => {
        const { private, ...rest } = req.body;

        const memory = new Memory(rest);
        memory.author = req.user._id;
        memory.isPrivate = private ? true : false;

        if(req.files && req.files.length) {
            const files = await uploadArrayFromMem(req.files); //upload files to the cloud
            const cloudRes = files.map(({ url: path, original_filename: originalname, bytes: size, public_id: filename }) => ({ path, originalname, size, filename }));
            //console.log(cloudRes);
            const images = await Image.insertMany(cloudRes);
            memory.gallery.push(...images);
        }

        await memory.save();

        req.flash("success", "Memory created!");
        res.send({ redirect: "/test" });
});

router.get("/memory/edit/:id", async (req, res) => {
    const memory = await Memory.findById(req.params.id).populate("gallery");
    if(memory && memory.author.equals(req.user._id)) {
        return res.render("memory/edit", { memory });
    }

    req.flash("error", "Action is not allowed!");
    res.redirect("/test");
});

router.post("/memory/edit/:id", upload.array("images"), async (req, res) => {
    const memory = await Memory.findByIdAndUpdate(req.params.id, { $set: { ...req.body.memory }, $pull: { gallery: { $in: req.body.delete } } }, { new: true });
    console.log(req.body);
    if (req.body.delete) {
        for (const toDelete of req.body.delete) {
            const image = await Image.findByIdAndDelete(toDelete);
            cloudinary.uploader.destroy(image.filename);

            console.log(toDelete);
            console.log(image);
        }
    }
    console.log(memory);

    if(req.files.length) {
        const images = req.files.map(({ path, originalname, size, filename }) => ({ path, originalname, size, filename }));
        const result = await Image.insertMany(images);

        memory.gallery.push(...result);
    }

    memory.isPrivate = req.body.private ? true : false;

    await memory.save();
    console.log(req.body);
    console.log(memory);

    req.flash("success", "Updated successfully!");
    res.send({ redirect: "/test" });
});

module.exports = router;