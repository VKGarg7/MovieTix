// Local-dev helper: seeds a realistic multi-city catalog — 18 real Indian
// cities, 4 real-chain theaters each, one screen per theater, and 8-10 movies
// per theater (drawn from a pool of 20 real films) with varied showtimes.
// Idempotent: safe to re-run — theaters/screens are upserted by name, and
// each theater's shows are fully replaced (not appended) on every run.
// Usage: node scripts/seedCityShowcase.js
import 'dotenv/config';
import mongoose from 'mongoose';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import Theater from '../models/Theater.js';
import Screen from '../models/Screen.js';
import slugify from '../utils/slugify.js';

// 20 real movies (real TMDB ids/poster paths), so theater catalogs look genuine.
const MOVIE_POOL = [
    {
        _id: '27205', title: 'Inception',
        overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception", the implantation of another person\'s idea into a target\'s subconscious.',
        poster_path: '/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg', backdrop_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
        release_date: '2010-07-15', original_language: 'en', tagline: 'Your mind is the scene of the crime.',
        genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }, { id: 12, name: 'Adventure' }],
        casts: [{ name: 'Leonardo DiCaprio', profile_path: '/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg' }, { name: 'Joseph Gordon-Levitt', profile_path: '/z2FA8js799xqtfiFjBTicFYdfk.jpg' }],
        vote_average: 8.372, runtime: 148,
    },
    {
        _id: '155', title: 'The Dark Knight',
        overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.',
        poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', backdrop_path: '/dqK9Hag1054tghRQSqLSfrkvQnA.jpg',
        release_date: '2008-07-16', original_language: 'en', tagline: 'Welcome to a world without rules.',
        genres: [{ id: 28, name: 'Action' }, { id: 80, name: 'Crime' }, { id: 53, name: 'Thriller' }],
        casts: [{ name: 'Christian Bale', profile_path: '/7Pxez9J8fuPd2Mn9kex13YALrCQ.jpg' }, { name: 'Heath Ledger', profile_path: '/AdWKVqyWpkYSfKE5Gb2qn8JzHni.jpg' }],
        vote_average: 8.533, runtime: 152,
    },
    {
        _id: '10681', title: 'WALL·E',
        overview: 'After hundreds of years doing what he was built for, WALL-E discovers a new purpose in life when he meets a sleek search robot named EVE.',
        poster_path: '/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg', backdrop_path: '/nYs4ZwnJBK4AgljhvzwNz7fpr3E.jpg',
        release_date: '2008-06-26', original_language: 'en', tagline: "After 700 years of doing what he was built for, he'll discover what he was meant for.",
        genres: [{ id: 16, name: 'Animation' }, { id: 10751, name: 'Family' }, { id: 878, name: 'Science Fiction' }],
        casts: [{ name: 'Ben Burtt', profile_path: '/7asFDWjls2bYQSfXJf5StjXmlhI.jpg' }, { name: 'Elissa Knight', profile_path: '/exRLyaNaHcgawQA0DoBxo5IvdoI.jpg' }],
        vote_average: 8.117, runtime: 98,
    },
    {
        _id: '19995', title: 'Avatar',
        overview: 'In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora on a unique mission, but becomes torn between following orders and protecting an alien civilization.',
        poster_path: '/gKY6q7SjCkAU6FqvqWybDYgUKIF.jpg', backdrop_path: '/vL5LR6WdxWPjLPFRLe133jXWsh5.jpg',
        release_date: '2009-12-16', original_language: 'en', tagline: 'Enter the world of Pandora.',
        genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }, { id: 12, name: 'Adventure' }],
        casts: [{ name: 'Sam Worthington', profile_path: '/vM1WIfYQ1HUBtlVPwB9Hp9fLcn8.jpg' }, { name: 'Zoe Saldaña', profile_path: '/fCJuIn1PMUQtYdRRSnnoZeMJVWs.jpg' }],
        vote_average: 7.61, runtime: 162,
    },
    {
        _id: '424', title: "Schindler's List",
        overview: 'The true story of how businessman Oskar Schindler saved over a thousand Jewish lives from the Nazis while they worked as slaves in his factory during World War II.',
        poster_path: '/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', backdrop_path: '/zb6fM1CX41D9rF9hdgclu0peUmy.jpg',
        release_date: '1993-12-15', original_language: 'en', tagline: 'Whoever saves one life, saves the world entire.',
        genres: [{ id: 18, name: 'Drama' }, { id: 36, name: 'History' }, { id: 10752, name: 'War' }],
        casts: [{ name: 'Liam Neeson', profile_path: '/sRLev3wJioBgun3ZoeAUFpkLy0D.jpg' }, { name: 'Ben Kingsley', profile_path: '/k3Dmu49B2akwDvgqy52MOxznI59.jpg' }],
        vote_average: 8.57, runtime: 195,
    },
    {
        _id: '8363', title: 'Superbad',
        overview: 'Two co-dependent high school seniors are forced to deal with separation anxiety after their plan to stage a booze-soaked party goes awry.',
        poster_path: '/ek8e8txUyUwd2BNqj6lFEerJfbq.jpg', backdrop_path: '/coru98UcFBzJIU7bxZguxaePgu0.jpg',
        release_date: '2007-08-17', original_language: 'en', tagline: 'Come and get some!',
        genres: [{ id: 35, name: 'Comedy' }],
        casts: [{ name: 'Jonah Hill', profile_path: '/cymlWttB83MsAGR2EkTgANtjeRH.jpg' }, { name: 'Michael Cera', profile_path: '/lFKyW2C7xj7X4nWpOEbVIDGOKrH.jpg' }],
        vote_average: 7.269, runtime: 113,
    },
    {
        _id: '346698', title: 'Barbie',
        overview: 'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land. However, when they get a chance to go to the real world, they soon discover the joys and perils of living among humans.',
        poster_path: '/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', backdrop_path: '/3N5QNUqS76GFYNoEayfkkJyAyTN.jpg',
        release_date: '2023-07-19', original_language: 'en', tagline: "She's everything. He's just Ken.",
        genres: [{ id: 35, name: 'Comedy' }, { id: 12, name: 'Adventure' }, { id: 14, name: 'Fantasy' }],
        casts: [{ name: 'Margot Robbie', profile_path: '/au6Hq8nQXJD67mDtl34ZOm8DXrh.jpg' }, { name: 'Ryan Gosling', profile_path: '/lyUyVARQKhGxaxy0FbPJCQRpiaW.jpg' }],
        vote_average: 6.916, runtime: 114,
    },
    {
        _id: '569094', title: 'Spider-Man: Across the Spider-Verse',
        overview: "After reuniting with Gwen Stacy, Brooklyn's full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters the Spider Society.",
        poster_path: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', backdrop_path: '/9xfDWXAUbFXQK585JvByT5pEAhe.jpg',
        release_date: '2023-05-31', original_language: 'en', tagline: "It's how you wear the mask that matters.",
        genres: [{ id: 16, name: 'Animation' }, { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 878, name: 'Science Fiction' }],
        casts: [{ name: 'Shameik Moore', profile_path: '/ovUKfVOwJ7CadEHaG3NDsfA5xRq.jpg' }, { name: 'Hailee Steinfeld', profile_path: '/4K2dzM3odGiVZOQOD6RjVxNq2ZQ.jpg' }],
        vote_average: 8.34, runtime: 140,
    },
    {
        _id: '609681', title: 'The Marvels',
        overview: "When her duties send her to an anomalous wormhole linked to a Kree revolutionary, Carol's powers become entangled with that of Jersey City super-fan Kamala Khan and Carol's estranged niece, Monica Rambeau.",
        poster_path: '/9GBhzXMFjgcZ3FdR9w3bUMMTps5.jpg', backdrop_path: '/w4pRLYYbhHn3sh9kqRgPZM6GjyS.jpg',
        release_date: '2023-11-08', original_language: 'en', tagline: 'Higher. Further. Faster. Together.',
        genres: [{ id: 878, name: 'Science Fiction' }, { id: 12, name: 'Adventure' }, { id: 28, name: 'Action' }],
        casts: [{ name: 'Brie Larson', profile_path: '/rlbQbpu3tkMAikPWM53VElMUnzR.jpg' }, { name: 'Iman Vellani', profile_path: '/oBpOjLAH8heYNNJZN1Z5jVQhAKC.jpg' }],
        vote_average: 5.933, runtime: 105,
    },
    {
        _id: '634649', title: 'Spider-Man: No Way Home',
        overview: 'Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a super-hero.',
        poster_path: '/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg', backdrop_path: '/zD5v1E4joAzFvmAEytt7fM3ivyT.jpg',
        release_date: '2021-12-15', original_language: 'en', tagline: 'Enter the Multiverse.',
        genres: [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 878, name: 'Science Fiction' }],
        casts: [{ name: 'Tom Holland', profile_path: '/xKBAaPIa1c7tzZD3Y0MhBLv4hPE.jpg' }, { name: 'Zendaya', profile_path: '/1qup8tSt95HLbcy2c2xrx4iJNxv.jpg' }],
        vote_average: 7.935, runtime: 148,
    },
    {
        _id: '508442', title: 'Soul',
        overview: 'Joe Gardner is a middle school teacher with a love for jazz music. After an accident separates his soul from his body, he is transported to the You Seminar to find his way back to Earth.',
        poster_path: '/6jmppcaubzLF8wkXM36ganVISCo.jpg', backdrop_path: '/rQaHA74pevnGsxcKGaoZVGWe9TC.jpg',
        release_date: '2020-12-25', original_language: 'en', tagline: 'Everybody has a soul. Joe Gardner is about to find his.',
        genres: [{ id: 16, name: 'Animation' }, { id: 10751, name: 'Family' }, { id: 18, name: 'Drama' }],
        casts: [{ name: 'Jamie Foxx', profile_path: '/zD8Nsy4Xrghp7WunwpCj5JKBPeU.jpg' }, { name: 'Tina Fey', profile_path: '/yPTAi1iucXf85UpiFPtyiTSM6do.jpg' }],
        vote_average: 8.091, runtime: 101,
    },
    {
        _id: '872585', title: 'Oppenheimer',
        overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
        poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', backdrop_path: '/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg',
        release_date: '2023-07-19', original_language: 'en', tagline: 'The world forever changes.',
        genres: [{ id: 18, name: 'Drama' }, { id: 36, name: 'History' }],
        casts: [{ name: 'Cillian Murphy', profile_path: '/2lKs67r7FI4bPu0AXxMUJZxmUXn.jpg' }, { name: 'Emily Blunt', profile_path: '/5nCSG5TL1bP1geD8aaBfaLnLLCD.jpg' }],
        vote_average: 8.024, runtime: 181,
    },
    {
        _id: '76341', title: 'Mad Max: Fury Road',
        overview: 'An apocalyptic story set in the furthest reaches of our planet, where humanity is broken and most everyone is fighting for the necessities of life.',
        poster_path: '/ulcAi4dKpAjHwYGS08vNyx9H6I9.jpg', backdrop_path: '/uT895WNwm0aIJRtGizcQhrejWUo.jpg',
        release_date: '2015-05-13', original_language: 'en', tagline: 'The future belongs to the mad.',
        genres: [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 878, name: 'Science Fiction' }],
        casts: [{ name: 'Tom Hardy', profile_path: '/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg' }, { name: 'Charlize Theron', profile_path: '/gd7ShD0yt4bsR2STeQ19KQ6hvXL.jpg' }],
        vote_average: 7.635, runtime: 121,
    },
    {
        _id: '335984', title: 'Blade Runner 2049',
        overview: "Thirty years after the events of the first film, a new blade runner unearths a long-buried secret that has the potential to plunge what's left of society into chaos.",
        poster_path: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg', backdrop_path: '/gNdLJU9TxrpGx4dkZidjys3fyy0.jpg',
        release_date: '2017-10-04', original_language: 'en', tagline: 'The key to the future is finally unearthed.',
        genres: [{ id: 878, name: 'Science Fiction' }, { id: 18, name: 'Drama' }],
        casts: [{ name: 'Ryan Gosling', profile_path: '/lyUyVARQKhGxaxy0FbPJCQRpiaW.jpg' }, { name: 'Harrison Ford', profile_path: '/pjBMJVPpcZK23Vt1nzr1zEBTWrP.jpg' }],
        vote_average: 7.597, runtime: 164,
    },
    {
        _id: '335983', title: 'Venom',
        overview: 'Investigative journalist Eddie Brock attempts a comeback following a scandal, but accidentally becomes the host of Venom, a violent, super powerful alien symbiote.',
        poster_path: '/2uNW4WbgBXL25BAbXGLnLqX71Sw.jpg', backdrop_path: '/hNsYUryiwxcdeTMkaBcPF3iEg0p.jpg',
        release_date: '2018-09-28', original_language: 'en', tagline: 'The world has enough superheroes.',
        genres: [{ id: 878, name: 'Science Fiction' }, { id: 28, name: 'Action' }],
        casts: [{ name: 'Tom Hardy', profile_path: '/d81K0RH8UX7tZj49tZaQhZ9ewH.jpg' }, { name: 'Michelle Williams', profile_path: '/jn3BVMVbIptz2gc6Fhxo1qwJVvW.jpg' }],
        vote_average: 6.825, runtime: 112,
    },
    {
        _id: '118340', title: 'Guardians of the Galaxy',
        overview: '26 years after being abducted from Earth, Peter Quill finds himself the prime target of a manhunt after discovering an orb wanted by Ronan the Accuser.',
        poster_path: '/r7vmZjiyZw9rpJMQJdXpjgiCOk9.jpg', backdrop_path: '/uLtVbjvS1O7gXL8lUOwsFOH4man.jpg',
        release_date: '2014-07-30', original_language: 'en', tagline: "When things get bad, they'll do their worst.",
        genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }, { id: 12, name: 'Adventure' }],
        casts: [{ name: 'Chris Pratt', profile_path: '/cRH6HPAQ98PlOwwEvhYO4CM9lwu.jpg' }, { name: 'Zoe Saldaña', profile_path: '/fCJuIn1PMUQtYdRRSnnoZeMJVWs.jpg' }],
        vote_average: 7.906, runtime: 121,
    },
    {
        _id: '24428', title: 'The Avengers',
        overview: 'When an unexpected enemy emerges and threatens global safety and security, Nick Fury finds himself in need of a team to pull the world back from the brink of disaster.',
        poster_path: '/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg', backdrop_path: '/pGFQCp12a8andfPlpnmXz44IIvY.jpg',
        release_date: '2012-04-25', original_language: 'en', tagline: 'Some assembly required.',
        genres: [{ id: 878, name: 'Science Fiction' }, { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }],
        casts: [{ name: 'Robert Downey Jr.', profile_path: '/5qHNjhtjMD4YWH3UP0rm4tKwxCL.jpg' }, { name: 'Chris Evans', profile_path: '/3bOGNsHlrswhyW79uvIHH1V43JI.jpg' }],
        vote_average: 8.058, runtime: 143,
    },
    {
        _id: '299536', title: 'Avengers: Infinity War',
        overview: 'A despot of intergalactic infamy, Thanos, sets out to collect all six Infinity Stones and use them to inflict his twisted will on all of reality.',
        poster_path: '/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg', backdrop_path: '/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg',
        release_date: '2018-04-25', original_language: 'en', tagline: 'Destiny arrives all the same.',
        genres: [{ id: 12, name: 'Adventure' }, { id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }],
        casts: [{ name: 'Robert Downey Jr.', profile_path: '/5qHNjhtjMD4YWH3UP0rm4tKwxCL.jpg' }, { name: 'Chris Hemsworth', profile_path: '/piQGdoIQOF3C1EI5cbYZLAW1gfj.jpg' }],
        vote_average: 8.239, runtime: 149,
    },
    {
        _id: '299534', title: 'Avengers: Endgame',
        overview: "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers must assemble once more.",
        poster_path: '/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg', backdrop_path: '/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
        release_date: '2019-04-24', original_language: 'en', tagline: 'Avenge the fallen.',
        genres: [{ id: 12, name: 'Adventure' }, { id: 878, name: 'Science Fiction' }, { id: 28, name: 'Action' }],
        casts: [{ name: 'Robert Downey Jr.', profile_path: '/5qHNjhtjMD4YWH3UP0rm4tKwxCL.jpg' }, { name: 'Mark Ruffalo', profile_path: '/5GilHMOt5PAQh6rlUKZzGmaKEI7.jpg' }],
        vote_average: 8.238, runtime: 181,
    },
    {
        _id: '1368337', title: 'The Odyssey',
        overview: 'Odysseus, the legendary King of Ithaca, embarks on a long and perilous journey home following the Trojan War.',
        poster_path: '/5rhTDKUhPYvpdQIijFIs5VoWsON.jpg', backdrop_path: '/tYuC9kUwqhpDQ3pv1kLMqyMF1Jw.jpg',
        release_date: '2026-07-15', original_language: 'en', tagline: 'Defy the gods.',
        genres: [{ id: 12, name: 'Adventure' }, { id: 28, name: 'Action' }, { id: 14, name: 'Fantasy' }],
        casts: [{ name: 'Matt Damon', profile_path: '/aCvBXTAR9B1qRjIRzMBYhhbm1fR.jpg' }, { name: 'Tom Holland', profile_path: '/xKBAaPIa1c7tzZD3Y0MhBLv4hPE.jpg' }],
        vote_average: 8, runtime: 173,
    },
];

// 18 real Indian cities, each with 4 theaters using real multiplex chain
// names and real area/mall names local to that city.
const CITY_THEATERS = {
    Mumbai: [
        { name: 'PVR Icon', address: 'Infiniti Mall, Andheri West, Mumbai, MH' },
        { name: 'INOX Megaplex', address: 'R City Mall, Ghatkopar West, Mumbai, MH' },
        { name: 'Cinepolis Andheri', address: 'Fun Republic Mall, Andheri West, Mumbai, MH' },
        { name: 'Carnival Cinemas Metro', address: 'Metro Big Cinema, Dadar West, Mumbai, MH' },
    ],
    Delhi: [
        { name: 'PVR Priya', address: 'Priya Complex, Vasant Vihar, New Delhi, DL' },
        { name: 'INOX Nehru Place', address: 'Nehru Place, New Delhi, DL' },
        { name: 'Cinepolis Pacific Mall', address: 'Pacific Mall, Tagore Garden, New Delhi, DL' },
        { name: 'Miraj Cinemas Rajouri', address: 'Rajouri Garden, New Delhi, DL' },
    ],
    Bengaluru: [
        { name: 'PVR Forum', address: 'Forum Mall, Koramangala, Bengaluru, KA' },
        { name: 'INOX Garuda Mall', address: 'Garuda Mall, Magrath Road, Bengaluru, KA' },
        { name: 'Cinepolis Royal Meenakshi', address: 'Royal Meenakshi Mall, Bannerghatta Road, Bengaluru, KA' },
        { name: 'Carnival Cinemas Bannerghatta', address: 'Bannerghatta Road, Bengaluru, KA' },
    ],
    Chennai: [
        { name: 'PVR VR Chennai', address: 'VR Chennai, Anna Nagar, Chennai, TN' },
        { name: 'INOX Citi Centre', address: 'Citi Centre Mall, Mylapore, Chennai, TN' },
        { name: 'Cinepolis Grand Mall', address: 'Grand Mall, Velachery, Chennai, TN' },
        { name: 'AGS Cinemas Ashok Nagar', address: 'Ashok Nagar, Chennai, TN' },
    ],
    Hyderabad: [
        { name: 'PVR Panjagutta', address: 'Central Mall, Panjagutta, Hyderabad, TS' },
        { name: 'INOX GVK One', address: 'GVK One Mall, Banjara Hills, Hyderabad, TS' },
        { name: 'Cinepolis Manjeera', address: 'Manjeera Mall, KPHB, Hyderabad, TS' },
        { name: 'AMB Cinemas Gachibowli', address: 'Gachibowli, Hyderabad, TS' },
    ],
    Kolkata: [
        { name: 'PVR South City', address: 'South City Mall, Jodhpur Park, Kolkata, WB' },
        { name: 'INOX Quest Mall', address: 'Quest Mall, Syed Amir Ali Avenue, Kolkata, WB' },
        { name: 'Cinepolis Acropolis', address: 'Acropolis Mall, Rajdanga, Kolkata, WB' },
        { name: 'Priya Cinemas Deshapriya Park', address: 'Deshapriya Park, Kolkata, WB' },
    ],
    Pune: [
        { name: 'PVR Phoenix Marketcity', address: 'Phoenix Marketcity, Viman Nagar, Pune, MH' },
        { name: 'INOX Bund Garden', address: 'Bund Garden Road, Pune, MH' },
        { name: 'Cinepolis Seasons Mall', address: 'Seasons Mall, Magarpatta, Pune, MH' },
        { name: 'City Pride Kothrud', address: 'Kothrud, Pune, MH' },
    ],
    Ahmedabad: [
        { name: 'PVR Acropolis', address: 'Acropolis Mall, Thaltej, Ahmedabad, GJ' },
        { name: 'INOX Alpha One', address: 'AlphaOne Mall, Vastrapur, Ahmedabad, GJ' },
        { name: 'Cinepolis Himalaya Mall', address: 'Himalaya Mall, Drive-In Road, Ahmedabad, GJ' },
        { name: 'Wide Angle Cinemas Bopal', address: 'Bopal, Ahmedabad, GJ' },
    ],
    Jaipur: [
        { name: 'PVR World Trade Park', address: 'World Trade Park, Malviya Nagar, Jaipur, RJ' },
        { name: 'INOX Pink Square', address: 'Pink Square Mall, Panch Batti, Jaipur, RJ' },
        { name: 'Cinepolis Crystal Palm', address: 'Crystal Palm, Vaishali Nagar, Jaipur, RJ' },
        { name: 'Miraj Cinemas Malviya Nagar', address: 'Malviya Nagar, Jaipur, RJ' },
    ],
    Lucknow: [
        { name: 'PVR Phoenix Palassio', address: 'Phoenix Palassio Mall, Gomti Nagar, Lucknow, UP' },
        { name: 'INOX Riverside Mall', address: 'Riverside Mall, Gomti Nagar, Lucknow, UP' },
        { name: 'Cinepolis Fun Republic', address: 'Fun Republic Mall, Gomti Nagar, Lucknow, UP' },
        { name: 'Miraj Cinemas Hazratganj', address: 'Hazratganj, Lucknow, UP' },
    ],
    Chandigarh: [
        { name: 'PVR Elante', address: 'Elante Mall, Industrial Area Phase 1, Chandigarh' },
        { name: 'INOX Centra Mall', address: 'Centra Mall, Zirakpur, Chandigarh' },
        { name: 'Cinepolis Fun Republic', address: 'Fun Republic Mall, Sector 20, Chandigarh' },
        { name: 'DT Cinemas Sector 17', address: 'Sector 17, Chandigarh' },
    ],
    Kochi: [
        { name: 'PVR Forum Mall', address: 'Forum Mall, Marine Drive, Kochi, KL' },
        { name: 'INOX Oberon Mall', address: 'Oberon Mall, Edappally, Kochi, KL' },
        { name: 'Cinepolis Lulu Mall', address: 'Lulu Mall, Edappally, Kochi, KL' },
        { name: 'Q Cinemas Kaloor', address: 'Kaloor, Kochi, KL' },
    ],
    Indore: [
        { name: 'PVR Treasure Island', address: 'Treasure Island Mall, MG Road, Indore, MP' },
        { name: 'INOX C21 Mall', address: 'C21 Mall, AB Road, Indore, MP' },
        { name: 'Cinepolis Malhar Mega Mall', address: 'Malhar Mega Mall, Vijay Nagar, Indore, MP' },
        { name: 'Velocity Mall Cinemas', address: 'Velocity Mall, Indore, MP' },
    ],
    Bathinda: [
        { name: 'PVR Bathinda', address: 'Mittal Mall, Bathinda, PB' },
        { name: 'Carnival Cinemas City Heart', address: 'City Heart Mall, Bathinda, PB' },
        { name: 'INOX Bathinda', address: 'GT Road, Bathinda, PB' },
        { name: 'Miraj Cinemas Bathinda', address: 'Model Town, Bathinda, PB' },
    ],
    Nagpur: [
        { name: 'PVR Empress Mall', address: 'Empress Mall, Sitabuldi, Nagpur, MH' },
        { name: 'INOX Fun-N-Food Village', address: 'Fun-N-Food Village, Nagpur, MH' },
        { name: 'Cinepolis Vijetha Superstore', address: 'Vijetha Superstore, Nagpur, MH' },
        { name: 'Big Cinemas Nagpur', address: 'Wardha Road, Nagpur, MH' },
    ],
    Surat: [
        { name: 'PVR Rahul Raj Mall', address: 'Rahul Raj Mall, Adajan, Surat, GJ' },
        { name: 'INOX Iscon Mall', address: 'Iscon Mall, Vesu, Surat, GJ' },
        { name: 'Cinepolis VR Surat', address: 'VR Surat, Dumas Road, Surat, GJ' },
        { name: 'Prime Cinemas Surat', address: 'Ring Road, Surat, GJ' },
    ],
    Coimbatore: [
        { name: 'PVR Fun Republic', address: 'Fun Republic Mall, Coimbatore, TN' },
        { name: 'INOX Prozone Mall', address: 'Prozone Mall, Coimbatore, TN' },
        { name: 'Cinepolis Brookefields', address: 'Brookefields Mall, Coimbatore, TN' },
        { name: 'KG Cinemas RS Puram', address: 'RS Puram, Coimbatore, TN' },
    ],
    Guwahati: [
        { name: 'PVR Vishal', address: 'Vishal Mega Mart Complex, Guwahati, AS' },
        { name: 'INOX Guwahati Central', address: 'Guwahati Central Mall, Guwahati, AS' },
        { name: 'Cinepolis Sixmile', address: 'Sixmile, Guwahati, AS' },
        { name: 'Anuradha Talkies Paltan Bazar', address: 'Paltan Bazar, Guwahati, AS' },
    ],
};

// approximate city centers, so geolocation isn't identical for every theater in a city
const CITY_COORDS = {
    Mumbai: [19.0760, 72.8777], Delhi: [28.6139, 77.2090], Bengaluru: [12.9716, 77.5946],
    Chennai: [13.0827, 80.2707], Hyderabad: [17.3850, 78.4867], Kolkata: [22.5726, 88.3639],
    Pune: [18.5204, 73.8567], Ahmedabad: [23.0225, 72.5714], Jaipur: [26.9124, 75.7873],
    Lucknow: [26.8467, 80.9462], Chandigarh: [30.7333, 76.7794], Kochi: [9.9312, 76.2673],
    Indore: [22.7196, 75.8577], Bathinda: [30.2110, 74.9455], Nagpur: [21.1458, 79.0882],
    Surat: [21.1702, 72.8311], Coimbatore: [11.0168, 76.9558], Guwahati: [26.1445, 91.7362],
};

const SHOW_TIMES = ['10:00', '14:00', '18:30', '21:45'];
const DAYS_AHEAD = 7;
const SHOW_PRICE_RANGE = [180, 320];

// Deterministic pseudo-random so re-running the script produces the same
// catalog (idempotent output), seeded per-theater.
function seededRandom(seedStr) {
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
    return () => {
        seed = (seed * 1103515245 + 12345) >>> 0;
        return seed / 0xFFFFFFFF;
    };
}

function pickMovies(rand, count) {
    const shuffled = [...MOVIE_POOL];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
}

async function ensureScreen(theaterDoc) {
    const rows = [
        ...'ABCDE'.split('').map((label) => ({ label, seatCount: 10, seatType: 'regular' })),
        ...'FG'.split('').map((label) => ({ label, seatCount: 8, seatType: 'premium' })),
        { label: 'H', seatCount: 6, seatType: 'recliner' },
    ];

    let screen = await Screen.findOne({ theater: theaterDoc._id, name: 'Screen 1' });
    if (!screen) {
        screen = new Screen({ theater: theaterDoc._id, name: 'Screen 1' });
    }
    screen.rows = rows;
    await screen.save();
    return screen;
}

async function seed() {
    await mongoose.connect(`${process.env.MONGODB_URI}/MovieTix`);
    console.log('Connected to database');

    for (const movieData of MOVIE_POOL) {
        await Movie.findByIdAndUpdate(movieData._id, movieData, { upsert: true, new: true, setDefaultsOnInsert: true });
    }
    console.log(`Upserted ${MOVIE_POOL.length} movies into the shared pool.`);

    let theaterCount = 0;
    let showCount = 0;

    for (const [city, theaters] of Object.entries(CITY_THEATERS)) {
        const [baseLat, baseLng] = CITY_COORDS[city] || [0, 0];

        for (let i = 0; i < theaters.length; i++) {
            const { name, address } = theaters[i];
            const rand = seededRandom(`${city}-${name}`);

            const theater = await Theater.findOneAndUpdate(
                { name, city },
                {
                    name,
                    slug: slugify(`${name}-${city}`),
                    city,
                    address,
                    // small deterministic offset per theater so they don't all sit on the exact same point
                    geolocation: { lat: baseLat + (i * 0.01), lng: baseLng + (i * 0.01) },
                    contactEmail: `${slugify(name)}@example.com`,
                    isActive: true,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            theaterCount++;

            const screen = await ensureScreen(theater);

            const movieCount = 8 + Math.floor(rand() * 3); // 8-10 movies per theater
            const moviesForTheater = pickMovies(rand, movieCount);

            // re-running the script fully replaces this theater's shows, so it stays idempotent
            const theaterScreenIds = [screen._id];
            await Show.deleteMany({ screen: { $in: theaterScreenIds } });

            const showsToCreate = [];
            const showPrice = SHOW_PRICE_RANGE[0] + Math.floor(rand() * (SHOW_PRICE_RANGE[1] - SHOW_PRICE_RANGE[0]));

            for (const movie of moviesForTheater) {
                for (let dayOffset = 0; dayOffset < DAYS_AHEAD; dayOffset++) {
                    const date = new Date();
                    date.setDate(date.getDate() + dayOffset);
                    const dateStr = date.toISOString().split('T')[0];

                    // each movie plays 2 of the 4 daily slots at this theater, varied by movie
                    const startSlot = Math.floor(rand() * (SHOW_TIMES.length - 1));
                    const timesForMovie = [SHOW_TIMES[startSlot], SHOW_TIMES[(startSlot + 2) % SHOW_TIMES.length]];

                    for (const time of timesForMovie) {
                        showsToCreate.push({
                            movie: movie._id,
                            screen: screen._id,
                            showDateTime: new Date(`${dateStr}T${time}:00+05:30`),
                            showPrice,
                            occupiedSeats: {},
                        });
                    }
                }
            }

            await Show.insertMany(showsToCreate);
            showCount += showsToCreate.length;
            console.log(`  ${city} — ${name}: ${moviesForTheater.length} movies, ${showsToCreate.length} shows`);
        }
    }

    console.log(`Done. Theaters upserted: ${theaterCount}. Total shows created: ${showCount}.`);
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
