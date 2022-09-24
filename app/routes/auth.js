const express = require("express");
const router = express.Router();
const { validateSeq,
        validateSignInEmail,
        validateSignInPassword,
        loginUser,
        checkValidationErrors,
        validateRegisterUser,
        validateRegisterEmail,
        validateRegisterPassword,
        validateRegisterConfirm,
        registerUser
        } = require("../helpers/validation");
const { ApplicationError, handleError } = require("../helpers/error");

router.get("/signout", (req, res) => {
    req.session = null;
    res.redirect("/");
});

router.get("/signin", (req, res) => {
    //console.log(req.session);
    res.render("auth/signin");
});

router.post("/signin", 
    validateSignInEmail, 
    validateSignInPassword,
    checkValidationErrors("auth/signin"),
    loginUser(), //validation ok, try and login
    handleError(async (req, res) => {
        const returnTo = req.session.rememberedURL;
        req.session.rememberedURL = null;
        //flash success
        req.flash("success", "Welcome back!");
        res.redirect(returnTo ? returnTo : "/");
}));

router.get("/register", (req, res) => {
    res.render("auth/register");
});

router.post("/register",
    validateRegisterUser,
    validateRegisterEmail,
    validateRegisterPassword,
    validateRegisterConfirm,
    checkValidationErrors("auth/register"),
    registerUser(), //all ok, register user
    handleError(async (req, res) => {
        const returnTo = req.session.rememberedURL;
        req.session.rememberedURL = null;
        //flash success
        req.flash("success", "You are now registered!");
        res.redirect(returnTo ? returnTo : "/");
}));

module.exports = router;