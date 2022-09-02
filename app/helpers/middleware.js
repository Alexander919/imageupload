const User = require("../models/user");

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
    if(req.session.userId) {
        const user = await User.findById(req.session.userId);
        if(user) {
            res.locals.loggedInUser = user;
        } else { //client has a cookie with userId but not the database
            req.session = null;
        }
    }
    next();
}

module.exports = {
    loggedInUser,
    flash,
    requireSignIn
};