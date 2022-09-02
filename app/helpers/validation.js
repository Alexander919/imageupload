const { body, validationResult } = require('express-validator');
const User = require("../models/user");

module.exports = {
    validateSeq: (validations, renderOnErr) => {
        return async (req, res, next) => {
            for (let val of validations) {
                const result = await val.run(req);
                //stop any further validations is there is an error in any of the chains
                if (result.errors.length) {
                    break;
                }
            }

            const error = validationResult(req);
            if (error.isEmpty()) { //no errors
                return next();
            }

            return res.render(renderOnErr, { error });
        }
    },
    validateSignInEmail: 
        body("email").trim().notEmpty().withMessage("Email field can't be empty").bail().normalizeEmail().isEmail().withMessage("Not a valid email"),
    validateSignInPassword:
        body("password").trim().notEmpty().withMessage("Please provide a password"),
    validateRegisterUser:
        body("username").trim().notEmpty().bail().withMessage("Please provide username").isLength({ min: 3, max: 30 }).toLowerCase().withMessage("Username must be between 3-30 characters"),
    validateRegisterEmail:
        body("email").trim().notEmpty().bail().withMessage("Email field can't be empty").isEmail().normalizeEmail().withMessage("Not a valid email"),
    validateRegisterPassword:
        body("password").trim().notEmpty().bail().withMessage("Password field can't be empty").isStrongPassword().withMessage("Password is not strong enough(must have at least 8 characters contain 1 uppercase, 1 number and 1 symbol"),
    validateRegisterConfirm:
        body("confirm").trim().notEmpty().bail().withMessage("Field can't be empty").custom((val, { req }) => val === req.body.password).withMessage("Passwords do not match"),
    checkValidationErrors: renderOnErr => {
        return (req, res, next) => {
            const result = validationResult(req);

            console.log(result, "in checkValidationErrors");
            if (result.isEmpty()) { //no validation errors
                return next();
            }

            res.render(renderOnErr, { error: result });
        }
    },
    registerUser: () => {
        return async (req, res, next) => {
            const { username, email, password } = req.body;
            //static method in models/user.js
            const newUser = await User.hashPasswordAndCreate(username, email, password);

            if (newUser) {
                req.session.userId = newUser._id;
                return next();
            }
            //flash failure
            console.log("Failed to create user. Possible causes: user/email exists");
            return res.redirect("/register");
        }
    },
    loginUser: () => {
        return async (req, res, next) => {
            const { email, password } = req.body;
            //static method in models/user.js
            const user = await User.findByEmailAndAuth(email, password);

            if(user) {
                req.session.userId = user._id;
                return next();
            }
            //flash failure
            console.log("Failed to login. Check your credentials.");
            res.redirect("/signin");
        }
    }
};
