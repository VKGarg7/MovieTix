import express from 'express';
import { protectAdmin } from '../middleware/auth.js';
import {
    getMenuForTheater,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getAllMenuItemsForAdmin,
} from '../controllers/menuController.js';

const menuRouter = express.Router();

menuRouter.get('/', getMenuForTheater);

menuRouter.get('/admin', protectAdmin, getAllMenuItemsForAdmin);
menuRouter.post('/admin', protectAdmin, createMenuItem);
menuRouter.put('/admin/:itemId', protectAdmin, updateMenuItem);
menuRouter.delete('/admin/:itemId', protectAdmin, deleteMenuItem);

export default menuRouter;
