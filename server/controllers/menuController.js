import mongoose from 'mongoose';
import MenuItem from '../models/MenuItem.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { parsePagination, buildPageMeta } from '../utils/pagination.js';
import { loadTheaterScopedResource, resolveTheaterIdForCreate } from '../utils/theaterScope.js';

const validatePrice = (price) => {
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
        throw new AppError('price must be a non-negative number', 400, 'INVALID_INPUT');
    }
};

// GET /api/menu?theaterId=... — public, used by the checkout snack picker.
export const getMenuForTheater = asyncHandler(async (req, res) => {
    const { theaterId } = req.query;

    if (!theaterId || !mongoose.Types.ObjectId.isValid(theaterId)) {
        throw new AppError('A valid theaterId is required', 400, 'INVALID_INPUT');
    }

    const items = await MenuItem.find({ theaterId, isAvailable: true }).sort({ name: 1 });
    res.json({ success: true, items });
});

export const createMenuItem = asyncHandler(async (req, res) => {
    const { name, price, imageUrl, theaterId } = req.body;

    if (!name || price === undefined) {
        throw new AppError('name and price are required', 400, 'INVALID_INPUT');
    }
    validatePrice(price);

    const resolvedTheaterId = resolveTheaterIdForCreate(req.adminContext, theaterId);

    const item = await MenuItem.create({
        theaterId: resolvedTheaterId,
        name,
        price,
        imageUrl: imageUrl || '',
    });

    res.json({ success: true, item });
});

export const updateMenuItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { name, price, imageUrl, isAvailable } = req.body;

    const item = await loadTheaterScopedResource(MenuItem, itemId, req.adminContext, 'Menu item');

    if (name !== undefined) item.name = name;
    if (imageUrl !== undefined) item.imageUrl = imageUrl;
    if (isAvailable !== undefined) item.isAvailable = isAvailable;
    if (price !== undefined) {
        validatePrice(price);
        item.price = price;
    }

    await item.save();
    res.json({ success: true, item });
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
    const item = await loadTheaterScopedResource(MenuItem, req.params.itemId, req.adminContext, 'Menu item');
    await item.deleteOne();
    res.json({ success: true, message: 'Menu item deleted' });
});

export const getAllMenuItemsForAdmin = asyncHandler(async (req, res) => {
    const { role, theaterId } = req.adminContext;
    const filter = role === 'theaterAdmin' ? { theaterId } : {};

    const { page, limit, skip } = parsePagination(req.query);

    const [items, total] = await Promise.all([
        MenuItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        MenuItem.countDocuments(filter),
    ]);

    res.json({ success: true, items, pageInfo: buildPageMeta(page, limit, total) });
});
