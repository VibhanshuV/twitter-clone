import express from "express";
import mongoose from "mongoose";
import auth from "./routes/auth.js"
// import dotenv from "dotenv";

const app = express();

app.use("/api/auth", auth);

app.get('/',(req,res)=> {
    res.send("Hello");
})

// const PORT = process.env.PORT;
app.listen(3000,()=> {
    console.log("Server Running on port: ", 3000)
})