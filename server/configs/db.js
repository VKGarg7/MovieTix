import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', ()=> console.log('Database Connected'));
        mongoose.connection.on('disconnected', ()=> console.log('Database Disconnected'));
        mongoose.connection.on('error', (err)=> console.log('Database connection error:', err.message));

        await mongoose.connect(`${process.env.MONGODB_URI}/MovieTix`, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            retryWrites: true,
        })
    } catch (error){
         console.log(error.message);
    }
}

export default connectDB;