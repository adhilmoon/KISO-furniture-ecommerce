import mongoose from "mongoose";
import logger from "../utilities/logger.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_URL);

    logger.info(
      `MongoDB Connected successfully with host: ${conn.connection.host}`
    );

  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
