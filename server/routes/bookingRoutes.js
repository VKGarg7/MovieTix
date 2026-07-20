import express from 'express';
import { createBooking, getBookingStatus, getOccupiedSeats } from '../controllers/bookingController.js';
import { protectUser } from '../middleware/auth.js';

const bookingRouter = express.Router();


bookingRouter.post('/create', protectUser, createBooking);
bookingRouter.get('/seats/:showId', getOccupiedSeats);
bookingRouter.get('/status/:bookingId', protectUser, getBookingStatus);

export default bookingRouter;
