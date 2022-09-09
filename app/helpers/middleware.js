const User = require("../models/user");
const { uploadArrayCloudinaryFromMem } = require("../multercloud");


function normalizeUploaded(files) {
    return files.map(({ 
        url: path, 
        original_filename: originalname, 
        bytes: size, 
        public_id: filename 
    }) => ({ path, originalname, size, filename }));
}

async function requireSignIn(req, res, next) {
    if(!req.session.userId) {
        req.session.rememberedURL = req.originalUrl; //remember the page to return to
        return res.redirect("/signin");
    }

    next();
}

function flash(...titles) {
    return (req, res, next) => {
        req.flash = (title, msg) => {
            if (title && !msg) {
                const value = req.session[title];
                req.session[title] = null;

                return value;
            }
            req.session[title] = { msg };
        }
        //register messages
        titles.forEach(title => {
            res.locals[title] = req.flash(title);
        });

        next();
    }
}

async function loggedInUser(req, res, next) {
    req.user = {};

    if(req.session.userId) {
        const user = await User.findById(req.session.userId);
        if(user) {
            res.locals.loggedInUser = user;
            req.user = user;
        } else { //client has a cookie with userId but not the database
            req.session = null;
        }
    }
    next();
}

async function uploadCloudFromMem(req, res, next) {
    if (req.files && req.files.length) {
        try {
            const files = await uploadArrayCloudinaryFromMem(req.files); //upload files to the cloud
            req.files = normalizeUploaded(files);
        } catch(e) {
            req.files = [];
            console.error(e);
        }
    }
    next();
}

//TODO: add isAuthor middleware

module.exports = {
    loggedInUser,
    flash,
    requireSignIn,
    uploadCloudFromMem
};