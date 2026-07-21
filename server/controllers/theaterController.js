import Theater from '../models/Theater.js';
import Screen from '../models/Screen.js';
import Show from '../models/Show.js';

const MAX_ROWS = 26;

const validateRows = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_ROWS) return false;
    const seen = new Set();
    for (const r of rows) {
        if (typeof r.row !== 'string' || !/^[A-Z]$/.test(r.row)) return false;
        if (seen.has(r.row)) return false;
        seen.add(r.row);
        if (!Number.isInteger(r.seats) || r.seats < 1 || r.seats > 30) return false;
    }
    return true;
};

// API to create a theater
export const createTheater = async (req, res) => {
    try {
        const { name, city, address } = req.body;
        if (!name || !city || !address) {
            return res.status(400).json({ success: false, message: 'name, city and address are required' });
        }
        const theater = await Theater.create({ name, city, address });
        res.json({ success: true, theater });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Could not create theater' });
    }
};

// API to list all theaters (with their screens)
export const getTheaters = async (req, res) => {
    try {
        const theaters = await Theater.find({}).sort({ createdAt: -1 });
        const screens = await Screen.find({}).sort({ createdAt: -1 });

        const screensByTheater = new Map();
        screens.forEach((screen) => {
            const key = screen.theater.toString();
            if (!screensByTheater.has(key)) screensByTheater.set(key, []);
            screensByTheater.get(key).push(screen);
        });

        const result = theaters.map((theater) => ({
            ...theater.toObject(),
            screens: screensByTheater.get(theater._id.toString()) || []
        }));

        res.json({ success: true, theaters: result });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Could not fetch theaters' });
    }
};

// API to delete a theater (only if it has no screens)
export const deleteTheater = async (req, res) => {
    try {
        const { theaterId } = req.params;
        const screenCount = await Screen.countDocuments({ theater: theaterId });
        if (screenCount > 0) {
            return res.status(409).json({ success: false, message: 'Remove all screens from this theater first' });
        }
        await Theater.findByIdAndDelete(theaterId);
        res.json({ success: true, message: 'Theater deleted' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Could not delete theater' });
    }
};

// API to add a screen to a theater
export const createScreen = async (req, res) => {
    try {
        const { theaterId } = req.params;
        const { name, screenType, rows } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Screen name is required' });
        }
        if (!validateRows(rows)) {
            return res.status(400).json({ success: false, message: 'rows must be a non-empty list of { row: single uppercase letter, seats: 1-30 }, with no duplicate row letters' });
        }

        const theater = await Theater.findById(theaterId);
        if (!theater) {
            return res.status(404).json({ success: false, message: 'Theater not found' });
        }

        const screen = await Screen.create({
            theater: theaterId,
            name,
            screenType: screenType || 'Standard',
            rows
        });

        res.json({ success: true, screen });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Could not create screen' });
    }
};

// API to get a single screen's seat layout (used to render the seat picker)
export const getScreen = async (req, res) => {
    try {
        const { screenId } = req.params;
        const screen = await Screen.findById(screenId).populate('theater');
        if (!screen) {
            return res.status(404).json({ success: false, message: 'Screen not found' });
        }
        res.json({ success: true, screen });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Could not fetch screen' });
    }
};

// API to delete a screen (only if it has no shows)
export const deleteScreen = async (req, res) => {
    try {
        const { screenId } = req.params;
        const showCount = await Show.countDocuments({ screen: screenId });
        if (showCount > 0) {
            return res.status(409).json({ success: false, message: 'This screen still has shows scheduled on it' });
        }
        await Screen.findByIdAndDelete(screenId);
        res.json({ success: true, message: 'Screen deleted' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Could not delete screen' });
    }
};
