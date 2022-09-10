const express = require("express");
const router = express.Router();
const Memory = require("../models/memory");
const Image = require("../models/image");

const { checkValidationErrors, validateMemoryTitle, validateMemoryText } = require("../helpers/validation");
const { requireSignIn, uploadCloudFromMem } = require("../helpers/middleware");
const { ApplicationError, handleError } = require("../helpers/error");

const { multer_upload_memory, cloudinary } = require("../multercloud");

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
    multer_upload_memory.array("images"), //store files temporarily in memory(check validation before uploading to the cloud)
    validateMemoryTitle,
    validateMemoryText,
    checkValidationErrors("memory/new"),
    uploadCloudFromMem,
    handleError(async (req, res) => {
        const { private, memory: memoryFields } = req.body;

        const memory = new Memory(memoryFields);
        memory.author = req.user._id;
        memory.isPrivate = private ? true : false;

        if(req.files) {
            const images = await Image.insertMany(req.files);
            memory.gallery.push(...images);
        }

        await memory.save();

        req.flash("success", "Memory created!");
        res.send({ redirect: "/" });
}));

router.get("/memory/edit/:id", handleError(async (req, res) => {
    const memory = await Memory.findById(req.params.id).populate("gallery");
    if(memory && memory.author.equals(req.user._id)) {
        return res.render("memory/edit", { memory });
    }

    req.flash("error", "Action is not allowed!");
    res.redirect("/");
}));

router.post("/memory/edit/:id",
    multer_upload_memory.array("images"), 
    validateMemoryTitle,
    validateMemoryText, 
    checkValidationErrors("memory/edit", Memory, "gallery"), //second and third arguments are optional when we need a Model
    uploadCloudFromMem,
    handleError(async (req, res) => {
        const memory = await Memory.findByIdAndUpdate(
            req.params.id, 
            { 
                $set: { ...req.body.memory }, 
                $pull: { gallery: { $in: req.body.delete } } 
            }, 
            { new: true }
        );
        memory.isPrivate = req.body.private ? true : false;

        if (req.body.delete) {
            for (const toDelete of req.body.delete) {
                const image = await Image.findByIdAndDelete(toDelete);
                cloudinary.uploader.destroy(image.filename);
            }
        }

        if(req.files) {
            const images = await Image.insertMany(req.files);
            memory.gallery.push(...images);
        }

        await memory.save();

        req.flash("success", "Updated successfully!");
        res.send({ redirect: "/" });
}));

module.exports = router;