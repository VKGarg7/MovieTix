import Booking from "../models/Booking.js";


// API controller function to get user bookings
export const getUserBookings = async (req, res) => {
    try {
        const user = req.auth().userId;

        const bookings = await Booking.find({ user}).populate({
            path: "show",
            populate: { path: "movie" }
        }).sort({ createdAt: -1 });

        res.json({ success: true, bookings });
        
    } catch (error) {
       console.error(error.message);
        res.json({ success: false, message: error.message });
    }
} 


// API controller function to add favorite movie in clerk user metadata
export const addFavorite = async (req, res) => {
    try {
        
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}