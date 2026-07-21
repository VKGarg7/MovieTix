import Booking from "../models/Booking.js";
import { clerkClient } from "@clerk/express";
import Movie from "../models/Movie.js";
import asyncHandler from '../utils/asyncHandler.js';


// API controller function to get user bookings
export const getUserBookings = asyncHandler(async (req, res) => {
    const user = req.auth().userId;

    const bookings = await Booking.find({ user }).populate({
        path: "show",
        populate: { path: "movie" }
    }).sort({ createdAt: -1 });

    res.json({ success: true, bookings });
});


// API controller function to update favorite movie in clerk user metadata
export const updateFavorite = asyncHandler(async (req, res) => {
    const { movieId } = req.body;
    const userId = req.auth().userId;

    const user = await clerkClient.users.getUser(userId);

    if (!user.privateMetadata.favorites) {
        user.privateMetadata.favorites = [];
    }

    if (!user.privateMetadata.favorites.includes(movieId)) {
        user.privateMetadata.favorites.push(movieId);
    } else {
        user.privateMetadata.favorites = user.privateMetadata.favorites.filter(item => item !== movieId);
    }

    await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
            favorites: user.privateMetadata.favorites,
        },
    });


    res.json({ success: true, message: "Favorite movies updated" });
});


export const getFavorites = asyncHandler(async (req, res) => {
    const user = await clerkClient.users.getUser(req.auth().userId);
    const favorites = user.privateMetadata.favorites;

    //getting movies from database
    const movies = await Movie.find({ _id: { $in: favorites }});

    res.json({ success: true, movies });
});
