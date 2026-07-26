// Shared test-data factories for controller/model tests. Each accepts
// overrides so individual tests can vary just the fields they care about.
import Theater from '../../models/Theater.js';
import Screen from '../../models/Screen.js';
import Movie from '../../models/Movie.js';
import Show from '../../models/Show.js';

export const createTestTheater = async (overrides = {}) => Theater.create({
    name: 'PVR',
    slug: 'pvr-noida',
    city: 'Noida',
    address: 'DLF Mall of India',
    geolocation: { lat: 28.5677, lng: 77.3219 },
    contactEmail: 'pvr.noida@example.com',
    ...overrides,
});

export const createTestScreen = async (theaterId, overrides = {}) => Screen.create({
    theater: theaterId,
    name: 'Screen 1',
    rows: [{ label: 'A', seatCount: 9, seatType: 'regular' }],
    ...overrides,
});

export const createTestMovie = async (id = 'test-movie-1', overrides = {}) => Movie.create({
    _id: id,
    title: `Movie ${id}`,
    overview: 'A movie for testing.',
    poster_path: '/test.jpg',
    backdrop_path: '/test-backdrop.jpg',
    release_date: '2026-01-01',
    genres: [{ id: 1, name: 'Test' }],
    casts: [{ name: 'Test Actor' }],
    vote_average: 7.5,
    runtime: 100,
    ...overrides,
});

export const createTestShow = async (movieId, screenId, overrides = {}) => Show.create({
    movie: movieId,
    screen: screenId,
    showDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    showPrice: 200,
    occupiedSeats: {},
    ...overrides,
});
