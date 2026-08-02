import axios from 'axios';

const tmdb = axios.create({
    baseURL: 'https://api.themoviedb.org/3',
});

tmdb.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${process.env.TMDB_API_KEY}`;
    return config;
});

export default tmdb;
