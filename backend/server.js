import express from "express";
import mongoose from "mongoose";
import auth from "./routes/auth.js"
import { connectMondoDB } from "./db/connectMongoDB.js";
import dotenv from "dotenv";

if(process.env.NODE_ENV !== "production") { //if the env is not propduction, get values from the .env file we defined
    dotenv.config();
}

const app = express();

app.use("/api/auth", auth);

app.get('/',(req,res)=> {
    res.send("Hello");
})

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=> {
    console.log("Server Running on port: ", PORT);
    connectMondoDB();
})