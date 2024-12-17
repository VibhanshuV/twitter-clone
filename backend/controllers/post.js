import Post from "../models/post.js";
import User from "../models/user.js";
import {v2 as cloudinary} from 'cloudinary';
import Notification from "../models/notification.js";

export const createPost = async (req,res) => {
    try {
        const {text} = req.body;
        let {img} = req.body;
        const userId = req.user._id.toString(); // you get it in the req object bc of the protectRoute middleware
        const user = await User.findById(userId);
        if(!user)return res.status(404).json({message: "User not found."});

        if(!text && !img) return res.status(400).json({message: "Post must have text or image"});

        if(img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url; //need to reassign img as we want secure url from cloudinary
        }
        const newPost = new Post({
            user: userId,
            text: text || "",
            img: img || "",
        })

        await newPost.save();
        return res.status(201).json(newPost);
        
    } catch (err) {
        console.log("Error in createPost controller", err.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const deletePost = async (req,res) => {
    try {
        const {id} = req.params;
        const currPost = await Post.findById(id);
        if(!currPost) return res.status(404).json({message: "Post not found."});
        if(currPost.user.toString() !== req.user._id.toString()) return res.status(401).json({message: "You are not authorized to delete this post."});
        
        
        if(currPost.img) {
            const imgId = currPost.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }
        
        await Post.findByIdAndDelete(id);
        return res.status(200).json({message: `Post ${id} deleted successfully.`});
    } catch (err) {
        console.log("Error in deletePost controller", err.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const likeUnlikePost = async (req,res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if(!post) return res.status(404).json({message: "Post does not exist."});

        const userId = req.user._id;
        const hasLiked = post.likes.includes(userId);
        if(hasLiked) { //already liked then unlike it
            await Post.findByIdAndUpdate(postId,{$pull: {likes:userId}});
            await User.findByIdAndUpdate(userId,{$pull: {likedPosts: postId}});
            const updatedLikes = post.likes.filter((id)=> id.toString()!==userId.toString());
            res.status(200).json(updatedLikes);
        } else { //liek the post
            post.likes.push(userId);
            await post.save();
            await User.findByIdAndUpdate(userId,{$push: {likedPosts: postId}});
            //Notification
            if(userId.toString() !== post.user.toString()) {
                const newNotification = new Notification({
                    type: "like",
                    from: req.user._id,
                    to: post.user,
                })
                await newNotification.save();
            }
            
            res.status(200).json(post.likes);
        }


    } catch (err) {
        console.log("Error in likeUnlikePost controller", err.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const commentOnPost = async (req,res) => {
    try {
        const {text} = req.body;
        const postId = req.params.id;
        const userId = req.user._id;

        if(!text) return res.status(400).json({message: "Comment cannot be empty."}); 
        const post = await Post.findById(postId);
        if(!post) return res.status(404).json({message: "Post does not exist."});

        const comment = {user: userId, text};
        post.comments.push(comment);
        await post.save();
        return res.status(200).json(post);
    } catch (err) {
        console.log("Error in commentOnPost controller", err.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const getAllPosts = async (req,res) => {
    try {
        const posts = await Post.find().sort({createdAt: -1}).populate({ // the createdAt gives us the latest timesatap one at top, i.e latest post at top in order
            path: "user",
            select: "-password"
        }).populate({
            path: "comments.user",
            select: "-password"
        });

        if(posts.length === 0) return res.status(200).json([]);

        res.status(200).json(posts);
    } catch (err) {
        console.log("Error in getAllPosts controller", err.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const getLikedPosts = async (req,res) => {
    try {
        const {id: userId} = req.params;
        const user = await User.findById(userId);
        if(!user) return res.status(404).json({message: "User not found."});

        const likedPosts = await Post.find({_id: {$in: user.likedPosts}}).populate({
            path: 'user',
            select: "-password"
        }).populate({
            path: 'comments.user',
            select: "-password"
        });

        res.status(200).json(likedPosts);
    } catch (err) {
        console.log("Error in getLikedPosts controller", err.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const getFollowingPosts = async (req,res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if(!user) return res.status(404).json({message: "User not found."});
        const following = user.following;
        const feedPosts = await Post.find({user: {$in: following}}).sort({createdAt: -1}).populate({ // the createdAt gives us the latest timesatap one at top, i.e latest post at top in order
            path: "user",
            select: "-password"
        }).populate({
            path: "comments.user",
            select: "-password"
        });

        res.status(200).json(feedPosts);
    } catch (err) {
        console.log("Error in getFollowingPosts controller", err.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const getUserPosts = async (req,res) => {
    try {
        const {username} = req.params;
        
        const user = await User.findOne({username});
        
        if(!user) return res.status(404).json({message: "User not found."});
        const userPosts = await Post.find({user: user._id}).sort({createdAt: -1}).populate({ // the createdAt gives us the latest timesatap one at top, i.e latest post at top in order
            path: "user",
            select: "-password"
        }).populate({
            path: "comments.user",
            select: "-password"
        });

        res.status(200).json(userPosts);
    } catch (err) {
        console.log("Error in getUserPosts controller", err.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}