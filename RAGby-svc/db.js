import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export async function connectDB(){
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ragby";
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("MongoDB connected");
}
