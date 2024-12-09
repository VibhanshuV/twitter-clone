import express from "express";
const router = express.Router();
import {login, signup, logout}from "../controllers/auth.js"


router.route("/signup")
    .post(signup)

router.route("/login")
    .post(login)

router.route("/logout")
    .post(logout)


export default router;