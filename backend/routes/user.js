import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { getUserProfile, getSuggestedProfile, updateUserProfile, followUnfollowUser } from '../controllers/user.js';

const router = express.Router();


router.get("/profile/:username", protectRoute, getUserProfile); //to get a user's profile data
router.get("/suggested", protectRoute,getSuggestedProfile); //get a list of suggested user
router.post("/follow/:id", protectRoute,followUnfollowUser); //to follow a user
router.post("/update", protectRoute, updateUserProfile); //to update ones own profile

export default router;