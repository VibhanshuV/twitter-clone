import Notification from "../models/notification.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";
import {v2 as cloudinary} from 'cloudinary';

export const getUserProfile = async (req,res) => {
    try{
        const {username} = req.params;
        const user = await User.findOne({username}).select("-password");
        if(!user) return res.status(400).json({message: "User does not exist!"});

        return res.status(201).json(user);
        
    } catch(err) {
        console.log("Error in getUserProfile controller", e.message);
        res.status(500).json({error: "Internal Server Error"});
    }
    
}

export const getSuggestedProfile = async (req,res) => {
    try {
        const userId = req.user._id;
        const userFollowedByMe = await User.findById(userId).select("following");
        const users = await User.aggregate([
            {   $match: {
                    _id: {$ne: userId}
                }
            },
            {$sample: {size:10}}
        ])

        const filteredUsers = users.filter(user=> !userFollowedByMe.following.includes(user._id));
        const suggestedUsers = filteredUsers.slice(0,4);
        suggestedUsers.forEach(user => {
            user.password=null
        });
        res.status(200).json(suggestedUsers);
    } catch(err) {
        console.log("Error in getSuggestedProfile controller", e.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const followUnfollowUser = async (req,res) => {
    try {
        const {id} = req.params; 
        if(id===req.user._id.toString()) return res.status(400).json({error: "You can't follow/unfollow yourself."});
        const otherUser = await User.findById(id);
        const currUser = await User.findById(req.user._id);
        if(!otherUser || !currUser) return res.status(400).json({message: "User does not exist!"});

        const isFollowing = currUser.following.includes(id);
        if(isFollowing) {
            //Unfollow user
            await User.findByIdAndUpdate(id,{$pull: {followers:req.user._id}});
            await User.findByIdAndUpdate(req.user._id,{$pull: {following:id}});
            //TODO return the id of the user as a response
            res.status(200).json({message: `User: ${id} unfollowed.`});
        } else {
            //Follow user
            await User.findByIdAndUpdate(id,{$push: {followers:req.user._id}});
            await User.findByIdAndUpdate(req.user._id,{$push: {following:id}});
            //send notification to user
            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                to: id,
            })

            await newNotification.save();
            //TODO return the id of the user as a response
            res.status(200).json({message: `User: ${id} followed.`});
        }

    } catch (err) {
        console.log("Error in followUnfollowUser controller", err.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const updateUserProfile = async (req,res) => {
    const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
	let { profileImg, coverImg } = req.body;

	const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
			return res.status(400).json({ error: "Please provide both current password and new password" });
		}

		if (currentPassword && newPassword) {
			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });
			if (newPassword.length < 6) {
				return res.status(400).json({ error: "Password must be at least 6 characters long" });
			}

			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(newPassword, salt);
		}

		if (profileImg) {
			if (user.profileImg) {
				// https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
				await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(profileImg);
			profileImg = uploadedResponse.secure_url;
		}

		if (coverImg) {
			if (user.coverImg) {
				await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            console.log(uploadedResponse);
			coverImg = uploadedResponse.secure_url;
		}

		user.fullName = fullName || user.fullName;
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio || user.bio;
		user.link = link || user.link;
		user.profileImg = profileImg || user.profileImg;
		user.coverImg = coverImg || user.coverImg;

		user = await user.save();

		// password should be null in response
		user.password = null;

		return res.status(200).json(user);
	} catch (error) {
		console.log("Error in updateUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
}