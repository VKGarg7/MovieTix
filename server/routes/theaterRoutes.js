import express from 'express';
import { protectAdmin } from '../middleware/auth.js';
import { createTheater, getTheaters, deleteTheater, createScreen, getScreen, deleteScreen } from '../controllers/theaterController.js';

const theaterRouter = express.Router();

theaterRouter.get('/all', protectAdmin, getTheaters);
theaterRouter.post('/create', protectAdmin, createTheater);
theaterRouter.delete('/:theaterId', protectAdmin, deleteTheater);
theaterRouter.post('/:theaterId/screens', protectAdmin, createScreen);
theaterRouter.get('/screens/:screenId', getScreen); // public: needed to render the seat picker for booking
theaterRouter.delete('/screens/:screenId', protectAdmin, deleteScreen);

export default theaterRouter;
