import express, { json } from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js"
import userRoutes from "./routes/user.js"
import postRoutes from "./routes/post.js"
import notificationRoutes from "./routes/notification.js"
import { connectMondoDB } from "./db/connectMongoDB.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";

if(process.env.NODE_ENV !== "production") { //if the env is not propduction, get values from the .env file we defined
    dotenv.config();
}

//configuring cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
})

const app = express();

// app.use(methodOverride('_method'));
app.use(express.json({limit: "5mb"})); //the limit is 100kb by default, so to upload images we need a higher limit
//limit should not be roo high to prevent ddos.
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);

app.get('/',(req,res)=> {
    res.send("Hello");
})

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=> {
    console.log("Server Running on port: ", PORT);
    connectMondoDB();
})