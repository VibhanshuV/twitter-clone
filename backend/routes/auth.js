import express from "express";
const router = express.Router();
import {login, signup, logout, getMe}from "../controllers/auth.js"
import { protectRoute } from "../middleware/protectRoute.js";


router.route("/signup")
    .post(signup)

router.route("/login")
    .post(login)

router.route("/logout")
    .post(logout)

router.get("/me", protectRoute ,getMe);

export default router;