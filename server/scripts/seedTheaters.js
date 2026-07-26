import 'dotenv/config';
import mongoose from 'mongoose';
import Theater from '../models/Theater.js';
import slugify from '../utils/slugify.js';

const SEED_THEATERS = [
    {
        name: 'PVR',
        city: 'Noida',
        address: 'DLF Mall of India, Sector 18, Noida, UP',
        geolocation: { lat: 28.5677, lng: 77.3219 },
        contactEmail: 'pvr.noida@example.com',
    },
    {
        name: 'PVR',
        city: 'Delhi',
        address: 'Select Citywalk, Saket, New Delhi, DL',
        geolocation: { lat: 28.5286, lng: 77.2192 },
        contactEmail: 'pvr.delhi@example.com',
    },
    {
        name: 'INOX',
        city: 'Mumbai',
        address: 'R City Mall, Ghatkopar West, Mumbai, MH',
        geolocation: { lat: 19.0857, lng: 72.9081 },
        contactEmail: 'inox.mumbai@example.com',
    },
    {
        name: 'INOX',
        city: 'Pune',
        address: 'Phoenix Marketcity, Viman Nagar, Pune, MH',
        geolocation: { lat: 18.5626, lng: 73.9184 },
        contactEmail: 'inox.pune@example.com',
    },
    {
        name: 'Cinepolis',
        city: 'Bengaluru',
        address: 'Forum Mall, Koramangala, Bengaluru, KA',
        geolocation: { lat: 12.9349, lng: 77.6106 },
        contactEmail: 'cinepolis.bengaluru@example.com',
    },
    {
        name: 'Cinepolis',
        city: 'Hyderabad',
        address: 'Manjeera Mall, KPHB, Hyderabad, TS',
        geolocation: { lat: 17.4933, lng: 78.3915 },
        contactEmail: 'cinepolis.hyderabad@example.com',
    },
    {
        name: 'PVR',
        city: 'Chennai',
        address: 'VR Chennai, Anna Nagar, Chennai, TN',
        geolocation: { lat: 13.0850, lng: 80.2101 },
        contactEmail: 'pvr.chennai@example.com',
    },
    {
        name: 'INOX',
        city: 'Kolkata',
        address: 'South City Mall, Jodhpur Park, Kolkata, WB',
        geolocation: { lat: 22.5023, lng: 88.3616 },
        contactEmail: 'inox.kolkata@example.com',
    },
    {
        name: 'Cinepolis',
        city: 'Ahmedabad',
        address: 'AlphaOne Mall, Vastrapur, Ahmedabad, GJ',
        geolocation: { lat: 23.0367, lng: 72.5297 },
        contactEmail: 'cinepolis.ahmedabad@example.com',
    },
    {
        name: 'PVR',
        city: 'Jaipur',
        address: 'World Trade Park, Malviya Nagar, Jaipur, RJ',
        geolocation: { lat: 26.8508, lng: 75.8051 },
        contactEmail: 'pvr.jaipur@example.com',
    },
    {
        name: 'Miraj Cinemas',
        city: 'Lucknow',
        address: 'Phoenix Palassio Mall, Gomti Nagar, Lucknow, UP',
        geolocation: { lat: 26.8607, lng: 81.0179 },
        contactEmail: 'miraj.lucknow@example.com',
    },
    {
        name: 'Carnival Cinemas',
        city: 'Bathinda',
        address: 'City Heart Mall, Bathinda, PB',
        geolocation: { lat: 30.2110, lng: 74.9455 },
        contactEmail: 'carnival.bathinda@example.com',
    },
    {
        name: 'INOX',
        city: 'Chandigarh',
        address: 'Elante Mall, Industrial Area Phase 1, Chandigarh',
        geolocation: { lat: 30.7046, lng: 76.8021 },
        contactEmail: 'inox.chandigarh@example.com',
    },
    {
        name: 'Cinepolis',
        city: 'Kochi',
        address: 'Lulu Mall, Edappally, Kochi, KL',
        geolocation: { lat: 10.0258, lng: 76.3081 },
        contactEmail: 'cinepolis.kochi@example.com',
    },
    {
        name: 'PVR',
        city: 'Indore',
        address: 'Treasure Island Mall, MG Road, Indore, MP',
        geolocation: { lat: 22.7196, lng: 75.8577 },
        contactEmail: 'pvr.indore@example.com',
    },
];

async function seed() {
    await mongoose.connect(`${process.env.MONGODB_URI}/MovieTix`);
    console.log('Connected to database');

    for (const theaterData of SEED_THEATERS) {
        const theater = await Theater.findOneAndUpdate(
            { name: theaterData.name, city: theaterData.city },
            { ...theaterData, timezone: theaterData.timezone ?? 'Asia/Kolkata', slug: slugify(`${theaterData.name}-${theaterData.city}`), isActive: true },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`Upserted theater: ${theater.name} (${theater.city})`);
    }

    console.log('Done seeding theaters.');
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
