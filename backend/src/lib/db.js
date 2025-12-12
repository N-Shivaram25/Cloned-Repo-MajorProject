import mongoose from "mongoose";

 let cachedConnection = globalThis.__MONGO_CONNECTION__;

export const connectDB = async () => {
  try {
    if (cachedConnection && mongoose.connection.readyState === 1) {
      return cachedConnection;
    }

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not set");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    cachedConnection = conn;
    globalThis.__MONGO_CONNECTION__ = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.log("Error in connecting to MongoDB", error);
    throw error;
  }
};
