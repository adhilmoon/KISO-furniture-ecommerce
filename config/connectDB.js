import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();

const connectDB=async ()=>{
    try {
        const connect=await mongoose.connect(process.env.DB_URL);
        console.log(`MongoDB Connected successfully with ...${connect.connection.host}`)
    } catch (error) {
        console.log('mongo db connection failur',error)
        process.exit(1)
    }
}

export default connectDB