require("dotenv").config();

const fs = require("fs/promises");

const mongoose = require("mongoose");
const Memory = require("../models/memory");
const Image = require("../models/image");
const User = require("../models/user");

const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const numOfMem = 5;

const users = [
    {   username: "alex",
        email: "alex@email.com",
        password: "12345"
    },
    {   username: "john",
        email: "john@email.com",
        password: "password"
    },
    {   username: "paul",
        email: "paul@email.com",
        password: "qwerty"
    }];

(async function main() {
    await mongoose.connect('mongodb://databaseserver:27017/imageupload');
    console.log("Database connected. (seed)");
})()
.then(async () => {
    await cleanCloudAt("seed/");
    await cleanDb();
    const cloudImages = dirUploadCloud(`${__dirname}/images`);
    const dbUsers = makeDbUsers(users);
    return Promise.all([ cloudImages, dbUsers ]);
})
.then(async data => {
    console.log("Seed Started.");
    const [ images, users ] = data;
    //const memories = Array.from({ length: 5 }, async () => {
    //    const gallery = Array.from({ length: 2 }, makeRandomDbImage.bind(null, images));
    //    return {
    //        title: `${random(data1)} ${random(data2)}`,
    //        text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Reiciendis sint, harum aperiam inventore placeat cupiditate beatae natus aliquid iste? Tempore assumenda voluptatem quas nesciunt, unde dolore quisquam nisi facilis natus?",
    //        isPrivate: false,
    //        author: random(users)._id,
    //        gallery: await Promise.all(gallery)
    //    }
    //});
    //return Memory.insertMany(await Promise.all(memories));

    for(let i = 0; i < numOfMem; i++) {
        const gallery = await Promise.all(Array.from({ length: random(images, true) }, makeRandomDbImage.bind(null, images)));

        const memory = new Memory({
            title: `${random(data1)} ${random(data2)}`,
            text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Reiciendis sint, harum aperiam inventore placeat cupiditate beatae natus aliquid iste? Tempore assumenda voluptatem quas nesciunt, unde dolore quisquam nisi facilis natus?",
            isPrivate: false,
            author: random(users)._id,
            gallery
        });
        memory.save();
    }
})
.then(() => {
    console.log("Seed Complete.");
    mongoose.connection.close();
})
.catch(err => console.log(err));

async function cleanCloudAt(prefix) {
    return cloudinary.api.delete_resources_by_prefix(prefix);
}

async function cleanDb() {
    return Promise.all([ Memory.deleteMany({}), Image.deleteMany({}), User.deleteMany({}) ]);
}

//if randNumBool is true then just a random number in range 0 - arr.length-1 is returned
function random(arr, randNumBool) {
    const rand = Math.floor(Math.random() * arr.length);
    return randNumBool ? rand : arr[rand];
}

//create a new Image and save it in the database
//filename is changed because I want to keep only N(4) copies in the cloud
//so they are basically one and the same images that are displayed but stored in different objects
async function makeRandomDbImage(bulk) {
    let { url: path, public_id: filename, original_filename: originalname, bytes: size } = random(bulk);
    filename = "don't want to remove from the cloud";
    const image = new Image({ path, filename, originalname, size });
    return image.save();
}

async function makeDbUsers(users) {
    const dbUsers = users.map(user => {
        const { username, email, password } = user;
        return User.hashPasswordAndCreate(username, email, password);
    });
    return Promise.all(dbUsers);
}
//makeImage([
//    {
//    url: "j;lj;lj;ljkl",
//    public_id: "080238023488",
//    original_filename: "jlkajdkf803jlksdjflkj",
//    bytes: 1123 
//    },
//    {
//    url: "kjlkjkjlksadf",
//    public_id: "9998989324",
//    original_filename: "kj;ljjkiuierieurqweq",
//    bytes: 34334 
//    }
//]);

async function dirUploadCloud(dir) {
    const uploadedImages = (await fs.readdir(dir)).map(file => {
        return cloudinary.uploader.upload(`${dir}/${file}`, { folder: "seed" });
    });
    return Promise.all(uploadedImages);
}

const data1 = [
    'Forest',
    'Ancient',
    'Petrified',
    'Roaring',
    'Cascade',
    'Tumbling',
    'Silent',
    'Redwood',
    'Bullfrog',
    'Maple',
    'Misty',
    'Elk',
    'Grizzly',
    'Ocean',
    'Sea',
    'Sky',
    'Dusty',
    'Diamond'
];

const data2 = [
    'Flats',
    'Village',
    'Canyon',
    'Pond',
    'Group Camp',
    'Horse Camp',
    'Ghost Town',
    'Camp',
    'Dispersed Camp',
    'Backcountry',
    'River',
    'Creek',
    'Creekside',
    'Bay',
    'Spring',
    'Bayshore',
    'Sands',
    'Mule Camp',
    'Hunting Camp',
    'Cliffs',
    'Hollow'
];