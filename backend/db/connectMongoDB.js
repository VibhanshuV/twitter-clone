import mongoose from "mongoose";

export const connectMondoDB = async () => {
    try{
        const connection = await mongoose.connect(process.env.DB_URL);
        console.log(`Mongo DB Connected: ${connection.connection.host}`);
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}