const express = require("express");
const router = express.Router();
const Memory = require("../models/memory");
const Image = require("../models/image");
//image upload and storage
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

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


router.get("/memory/new", (req, res) => {
    res.render("memory/new");
});

//TODO: add validation and requireSignIn
router.post("/memory/new", upload.array("images"), async (req, res) => {
    const {private, ...rest } = req.body;
    const images = req.files.map(({ path, originalname, size, filename }) => ({ path, originalname, size, filename }));

    const memory = new Memory(rest);
    const result = await Image.insertMany(images);
    memory.author = req.user._id;
    memory.gallery.push(...result);
    memory.isPrivate = private ? true : false;

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