const mongoose = require("mongoose");
const Memory = require("../models/memory");

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

function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
    await mongoose.connect('mongodb://databaseserver:27017/imageupload');
    console.log("Database connected.");
}

main().catch(err => console.log(err));

//TODO: make seeding more flexible; upload some images to cloudinary, create new Image objects, save to db and take their ids
(async () => {
    console.log("Seed has started.");
    const memories = [];
    await Memory.deleteMany({});
    for(let i = 0; i < 20; i++) {
        const memory = {
            title: `${random(data1)} ${random(data2)}`,
            text: "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Reiciendis sint, harum aperiam inventore placeat cupiditate beatae natus aliquid iste? Tempore assumenda voluptatem quas nesciunt, unde dolore quisquam nisi facilis natus?",
            isPrivate: false,
            author: "630f6ffdf1cd145e7b70d213",
            gallery: ["6314c6a8ae9752ab7f5d8d83", "6314c6a8ae9752ab7f5d8d84"]
        };
        memories.push(memory);
    }
    await Memory.insertMany(memories);

})().then(() => {
    console.log("Seed complete.");
    mongoose.connection.close();
}); 

