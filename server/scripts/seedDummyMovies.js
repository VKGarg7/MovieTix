// Local-dev helper: inserts a handful of real movies (matching actual TMDB
// IDs/poster paths) with upcoming shows, so the booking flow can be tested
// without hitting the TMDB API.
// Usage: node scripts/seedDummyMovies.js
import 'dotenv/config';
import mongoose from 'mongoose';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';

const SEED_MOVIES = [
    {
        _id: '27205', // Inception (2010)
        title: 'Inception',
        overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception", the implantation of another person\'s idea into a target\'s subconscious.',
        poster_path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
        backdrop_path: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
        release_date: '2010-07-15',
        original_language: 'en',
        tagline: 'Your mind is the scene of the crime.',
        genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }],
        casts: [
            { name: 'Leonardo DiCaprio', profile_path: '/wo2hJpn04vRJh0dAiwqoduSSuo0.jpg' },
            { name: 'Joseph Gordon-Levitt', profile_path: '/4U9G4YwTlIEyZ3pOqPjSVgmJC77.jpg' },
        ],
        vote_average: 8.4,
        runtime: 148,
    },
    {
        _id: '155', // The Dark Knight (2008)
        title: 'The Dark Knight',
        overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.',
        poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        backdrop_path: '/dqK9Hag1054tghRQSqLSfrkvQnA.jpg',
        release_date: '2008-07-16',
        original_language: 'en',
        tagline: 'Welcome to a world without rules.',
        genres: [{ id: 18, name: 'Drama' }, { id: 28, name: 'Action' }, { id: 80, name: 'Crime' }],
        casts: [
            { name: 'Christian Bale', profile_path: '/qCpZn2e3dimwbryLnqxZuI88PTi.jpg' },
            { name: 'Heath Ledger', profile_path: '/5Y9HnYYa9jF5QghaQ76dcuIeSri.jpg' },
        ],
        vote_average: 8.5,
        runtime: 152,
    },
    {
        _id: '10681', // WALL·E (2008)
        title: 'WALL·E',
        overview: 'WALL-E is the last robot left on an Earth that has been overrun with garbage and all humans have fled to outer space. For 700 years he has continued to try and clean up the planet, but has developed some rather interesting human-like qualities.',
        poster_path: '/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg',
        backdrop_path: '/pERbW8qdxoDf6q0N8w17JmSizmn.jpg',
        release_date: '2008-06-22',
        original_language: 'en',
        tagline: 'After 700 years of doing what he was built for, he\'ll discover what he was meant for.',
        genres: [{ id: 16, name: 'Animation' }, { id: 10751, name: 'Family' }],
        casts: [
            { name: 'Ben Burtt', profile_path: '/xEIssnrEyy3IN4Fw76LEmigKcY6.jpg' },
            { name: 'Elissa Knight', profile_path: '/8QGKZWZLZfz0KTG9lLTUAqQdKkZ.jpg' },
        ],
        vote_average: 8.1,
        runtime: 98,
    },
    {
        _id: '19995', // Avatar (2009)
        title: 'Avatar',
        overview: 'In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora on a unique mission, but becomes torn between following orders and protecting an alien civilization.',
        poster_path: '/kyeqWdyUXW608qlYkRqosgbbJyK.jpg',
        backdrop_path: '/vL5LR6WdxWPjLPFRLe133jXWsh5.jpg',
        release_date: '2009-12-15',
        original_language: 'en',
        tagline: 'Enter the World of Pandora.',
        genres: [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 878, name: 'Science Fiction' }],
        casts: [
            { name: 'Sam Worthington', profile_path: '/dc7v2W2xURpH8QW60whHYuMEwrf.jpg' },
            { name: 'Zoe Saldaña', profile_path: '/iOVbUH20il632nj2v9DFmDbYyOc.jpg' },
        ],
        vote_average: 7.6,
        runtime: 162,
    },
    {
        _id: '424', // Schindler's List (1993)
        title: "Schindler's List",
        overview: 'The true story of how businessman Oskar Schindler saved over a thousand Jewish lives from the Nazis while they worked as slaves in his factory during World War II.',
        poster_path: '/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg',
        backdrop_path: '/loRmRzQXZeqG78TqZuyvSlEQfZb.jpg',
        release_date: '1993-12-15',
        original_language: 'en',
        tagline: 'Whoever saves one life, saves the world entire.',
        genres: [{ id: 18, name: 'Drama' }, { id: 36, name: 'History' }, { id: 10752, name: 'War' }],
        casts: [
            { name: 'Liam Neeson', profile_path: '/6o1LX3ATmT8SFPUZuSNhqvKQPZm.jpg' },
            { name: 'Ben Kingsley', profile_path: '/xTHb4rTfSCce6RUpNAWq6Bx4B6t.jpg' },
        ],
        vote_average: 8.6,
        runtime: 195,
    },
    {
        _id: '8363', // Superbad (2007)
        title: 'Superbad',
        overview: 'Two co-dependent high school seniors are forced to deal with separation anxiety after their plan to stage a booze-soaked party goes awry.',
        poster_path: '/ek8e8txUyUwd2BNqj6lFEerJfbq.jpg',
        backdrop_path: '/wpe2ZQpp4hKWnZTHSJyKrs7Fjhc.jpg',
        release_date: '2007-08-17',
        original_language: 'en',
        tagline: 'Come as you aren\'t.',
        genres: [{ id: 35, name: 'Comedy' }],
        casts: [
            { name: 'Jonah Hill', profile_path: '/32ETqrOJ0BDWo1FXqUZ7v4EqSyG.jpg' },
            { name: 'Michael Cera', profile_path: '/wf2sMSj8G8jqjqYuqSVQclDMbxu.jpg' },
        ],
        vote_average: 7.3,
        runtime: 113,
    },
    {
        _id: '346698', // Barbie (2023)
        title: 'Barbie',
        overview: 'Barbie suffers a crisis that leads her to question her world and her existence.',
        poster_path: '/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
        backdrop_path: '/nHf61UzkfFno5X1ofIhugCPus2R.jpg',
        release_date: '2023-07-19',
        original_language: 'en',
        tagline: 'She\'s everything. He\'s just Ken.',
        genres: [{ id: 35, name: 'Comedy' }, { id: 12, name: 'Adventure' }, { id: 14, name: 'Fantasy' }],
        casts: [
            { name: 'Margot Robbie', profile_path: '/euDPyqLnuwaWMHajcU3oZ9uZezR.jpg' },
            { name: 'Ryan Gosling', profile_path: '/lyUyVARQKhGxaxy0FbPJCEfFDGs.jpg' },
        ],
        vote_average: 7.0,
        runtime: 114,
    },
    {
        _id: '569094', // Spider-Man: Across the Spider-Verse (2023)
        title: 'Spider-Man: Across the Spider-Verse',
        overview: 'After reuniting with Gwen Stacy, Brooklyn\'s full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters the Spider Society.',
        poster_path: '/8Vt6mWEReuy4Of61Lnj5Xj16zTHR.jpg',
        backdrop_path: '/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
        release_date: '2023-05-31',
        original_language: 'en',
        tagline: 'It\'s how you wear the mask that matters.',
        genres: [{ id: 16, name: 'Animation' }, { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }],
        casts: [
            { name: 'Shameik Moore', profile_path: '/tW9BhK3zg4rTFXWxfGYUpvBQmzE.jpg' },
            { name: 'Hailee Steinfeld', profile_path: '/oaGtjJb2H8dOhg8UNsqSuz8Vjeg.jpg' },
        ],
        vote_average: 8.4,
        runtime: 140,
    },
    {
        _id: '609681', // The Marvels (2023)
        title: 'The Marvels',
        overview: 'Carol Danvers gets her powers entangled with those of Kamala Khan and Monica Rambeau, forcing them to work together to save the universe.',
        poster_path: '/9GBhzXMFjgcZ3FdR9w3bUEHIINA.jpg',
        backdrop_path: '/AtsgWhDnHTq68L0lLsUrCnM7TjG.jpg',
        release_date: '2023-11-08',
        original_language: 'en',
        tagline: 'Higher. Further. Faster. Together.',
        genres: [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 878, name: 'Science Fiction' }],
        casts: [
            { name: 'Brie Larson', profile_path: '/8SRUfRUi6x4O68n0VCbDNRa6iGL.jpg' },
            { name: 'Teyonah Parris', profile_path: '/wTvOSw3nSGWoUAyYqOlDcRvsAyR.jpg' },
        ],
        vote_average: 6.3,
        runtime: 105,
    },
];

const SHOW_TIMES = ['10:00', '14:00', '18:30', '21:45'];
const SHOW_PRICE = 250;
// Long window so seeded shows don't age out of the "upcoming shows" queries
// for months, without needing to re-run this script regularly.
const DAYS_AHEAD = 90;

async function seed() {
    await mongoose.connect(`${process.env.MONGODB_URI}/MovieTix`);
    console.log('Connected to database');

    for (const movieData of SEED_MOVIES) {
        const movie = await Movie.findByIdAndUpdate(
            movieData._id,
            movieData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`Upserted movie: ${movie.title}`);

        const showsToCreate = [];
        for (let dayOffset = 0; dayOffset < DAYS_AHEAD; dayOffset++) {
            const date = new Date();
            date.setDate(date.getDate() + dayOffset);
            const dateStr = date.toISOString().split('T')[0];

            for (const time of SHOW_TIMES) {
                showsToCreate.push({
                    movie: movie._id,
                    showDateTime: new Date(`${dateStr}T${time}:00+05:30`),
                    showPrice: SHOW_PRICE,
                    occupiedSeats: {},
                });
            }
        }

        await Show.insertMany(showsToCreate);
        console.log(`  Created ${showsToCreate.length} shows for "${movie.title}"`);
    }

    console.log('Done seeding movies and shows.');
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
