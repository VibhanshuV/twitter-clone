import User from "../models/user.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const logout = async (req,res)=>{
    try{
        res.cookie("jwt","", {maxAge:0});
        res.status(200).json({message: "Logged out successfully"});
    } catch (e) {
        console.log("Error in loout controller", e.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const login = async (req,res)=>{
    try{
        const {password, username} = req.body;
        const currUser = await User.findOne({username}); 
        const isPasswordCorrect = await bcrypt.compare(password,currUser?.password || "");
        if(!currUser || !isPasswordCorrect) {
            return res.status(400).json({error: "Invalid Username or Password!"});
        } 
        generateTokenAndSetCookie(currUser._id, res);
        res.status(201).json({
            _id: currUser._id, 
            username: currUser.username, 
            email: currUser.email, 
            fullName: currUser.fullName,
        });
    } catch (e) {
        console.log("Error in login controller", e.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const signup = async (req,res)=>{
    try {
        const {fullName, email, password, username} = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;//pattern matching email
        if(!emailRegex.test(email)) {
            return res.status(400).json({error: "Invalid Email Format!"});
        }

        const existingUser = await User.findOne({username});
        if(existingUser) return res.status(400).json({error: "Username already taken!"});

        const existingEmail = await User.findOne({email});
        if(existingEmail) return res.status(400).json({error: "User with tha same email already exists!"});

        if(password.length<6) return res.status(400).json({error: "Password must be at least 6 characters long."});

        //Hashing Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);
        const newUser = new User({fullName, email, password: hashedPassword, username});
        if(newUser) {
            generateTokenAndSetCookie(newUser._id,res)
            await newUser.save();
            return res.status(201).json({
                _id: newUser._id, 
                userName: newUser.username, 
                email: newUser.email, 
                fullName: newUser.fullName,
            });
        } else {
            return res.status(400).json({error: "Invalid User Data!"});
        }
        
    } catch (e) {
        console.log("Error in signup controller", e.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const getMe = async (req,res) => {
    try{
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json(user);
    } catch(e) {
        console.log("Error in getMe controller", e.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}