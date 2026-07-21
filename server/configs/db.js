import mongoose from "mongoose";
import { logger } from "./logger.js";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', ()=> logger.info('Database Connected'));
        await mongoose.connect(`${process.env.MONGODB_URI}/MovieTix`)
    } catch (error){
         logger.error({ err: error }, 'Failed to connect to database');
    }
}

export default connectDB;
