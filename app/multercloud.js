const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const streamifier = require("streamifier");

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const cloudFolder = "ImageUpload";


const cloud_storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: cloudFolder,
    format: 'jpg', // supports promises as well
    //public_id: (req, file) => 'computed-filename-using-request',
  }
});
const multer_upload_cloud = multer({ storage: cloud_storage });

//store images in memory; do the validations then upload to cloudinary
const memory_storage = multer.memoryStorage();
const multer_upload_memory = multer({ storage: memory_storage });



async function uploadSingleCloudinaryFromMem(file) {
    return new Promise((resolve, reject) => {
        const upload_stream = cloudinary.uploader.upload_stream({ 
            folder: cloudFolder, 
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

async function uploadArrayCloudinaryFromMem(files) {
    const uploaded = files.map(file => uploadSingleCloudinaryFromMem(file));
    return Promise.all(uploaded);
}

module.exports = {
    multer_upload_cloud,
    multer_upload_memory,
    uploadArrayCloudinaryFromMem,
    uploadSingleCloudinaryFromMem,
    cloudinary
};
