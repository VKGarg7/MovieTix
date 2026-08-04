import { describe, it, expect } from "vitest";
import {
  parseBookingQuery,
  findMatchingMovies,
  filterShowtimesByWindow,
  findFirstAvailableShowtime,
  summarizeParsedQuery,
  MAX_SEATS_PER_BOOKING,
} from "../../client/src/lib/bookingAssistantParser.js";

const sampleShows = [
  {
    _id: "movie-1",
    title: "The Dark Knight",
    genres: [{ name: "Action" }, { name: "Crime" }],
  },
  {
    _id: "movie-2",
    title: "Superbad",
    genres: [{ name: "Comedy" }],
  },
  {
    _id: "movie-3",
    title: "Inception",
    genres: [{ name: "Action" }, { name: "Sci-Fi" }],
  },
  {
    _id: "movie-4",
    title: "The Hangover",
    genres: [{ name: "Comedy" }],
  },
];

const sampleTheaters = [
  { _id: "theater-1", name: "PVR Andheri", city: "Mumbai" },
  { _id: "theater-2", name: "INOX Bandra", city: "Mumbai" },
];

const sampleCities = ["Mumbai", "Delhi"];

describe("parseBookingQuery", () => {
  it("extracts seat count, genre, time window, and location from a natural query", () => {
    const parsed = parseBookingQuery(
      "2 seats for a comedy tonight after 8 near Andheri",
      { shows: sampleShows, theaters: sampleTheaters, cities: sampleCities }
    );

    expect(parsed.seats).toBe(2);
    expect(parsed.genre).toBe("comedy");
    expect(parsed.timeWindow).toBe("evening");
    expect(parsed.location).toBe("andheri");
    expect(parsed.issues).toHaveLength(0);
    expect(parsed.confidence).toBeGreaterThan(0);
  });

  it("extracts seat count from 'tickets' phrasing", () => {
    const parsed = parseBookingQuery("3 tickets for an action movie this evening", {
      shows: sampleShows,
      theaters: sampleTheaters,
      cities: sampleCities,
    });

    expect(parsed.seats).toBe(3);
    expect(parsed.genre).toBe("action");
    expect(parsed.timeWindow).toBe("evening");
  });

  it("extracts a movie title from the query", () => {
    const parsed = parseBookingQuery("book 2 seats for The Dark Knight tonight", {
      shows: sampleShows,
      theaters: sampleTheaters,
      cities: sampleCities,
    });

    expect(parsed.title).toBe("the dark knight");
    expect(parsed.seats).toBe(2);
  });

  it("maps 'after 8' to the evening window", () => {
    const parsed = parseBookingQuery("2 seats after 8", {
      shows: sampleShows,
      theaters: sampleTheaters,
      cities: sampleCities,
    });

    expect(parsed.timeWindow).toBe("evening");
  });

  it("maps '8pm' to the evening window", () => {
    const parsed = parseBookingQuery("2 seats at 8pm", {
      shows: sampleShows,
      theaters: sampleTheaters,
      cities: sampleCities,
    });

    expect(parsed.timeWindow).toBe("evening");
  });

  it("maps 'tomorrow night' to the night window", () => {
    const parsed = parseBookingQuery("1 seat for a thriller tomorrow night", {
      shows: sampleShows,
      theaters: sampleTheaters,
      cities: sampleCities,
    });

    expect(parsed.timeWindow).toBe("night");
  });

  it("detects a past-date reference as an issue", () => {
    const parsed = parseBookingQuery("200 seats for a movie yesterday", {
      shows: sampleShows,
      theaters: sampleTheaters,
      cities: sampleCities,
    });

    expect(parsed.issues.length).toBeGreaterThan(0);
    expect(parsed.issues[0]).toContain("past");
  });

  it("rejects seat counts above the max", () => {
    const parsed = parseBookingQuery("200 seats for a movie tonight", {
      shows: sampleShows,
      theaters: sampleTheaters,
      cities: sampleCities,
    });

    expect(parsed.issues.length).toBeGreaterThan(0);
    expect(parsed.issues[0]).toContain(`up to ${MAX_SEATS_PER_BOOKING}`);
  });

  it("returns zero confidence for an unparseable query", () => {
    const parsed = parseBookingQuery("hello world", {
      shows: sampleShows,
      theaters: sampleTheaters,
      cities: sampleCities,
    });

    expect(parsed.confidence).toBe(0);
    expect(parsed.seats).toBeNull();
    expect(parsed.timeWindow).toBeNull();
    expect(parsed.genre).toBeNull();
    expect(parsed.title).toBeNull();
  });

  it("extracts a city location", () => {
    const parsed = parseBookingQuery("2 seats for a comedy in Mumbai", {
      shows: sampleShows,
      theaters: sampleTheaters,
      cities: sampleCities,
    });

    expect(parsed.location).toBe("mumbai");
  });

  it("extracts a theater name as location", () => {
    const parsed = parseBookingQuery("2 seats at PVR Andheri", {
      shows: sampleShows,
      theaters: sampleTheaters,
      cities: sampleCities,
    });

    expect(parsed.location).toBe("pvr andheri");
  });
});

describe("findMatchingMovies", () => {
  it("finds movies by genre", () => {
    const parsed = { genre: "comedy", title: null };
    const matches = findMatchingMovies(parsed, sampleShows);
    expect(matches).toHaveLength(2);
    expect(matches.map((m) => m.title)).toContain("Superbad");
    expect(matches.map((m) => m.title)).toContain("The Hangover");
  });

  it("finds a single movie by title", () => {
    const parsed = { genre: null, title: "inception" };
    const matches = findMatchingMovies(parsed, sampleShows);
    expect(matches).toHaveLength(1);
    expect(matches[0].title).toBe("Inception");
  });

  it("returns all movies when no filters match", () => {
    const parsed = { genre: null, title: null };
    const matches = findMatchingMovies(parsed, sampleShows);
    expect(matches).toHaveLength(sampleShows.length);
  });
});

describe("filterShowtimesByWindow", () => {
  const dateTime = {
    "2026-08-04": [
      { time: "2026-08-04T10:00:00", showId: "s1" },
      { time: "2026-08-04T14:00:00", showId: "s2" },
      { time: "2026-08-04T19:00:00", showId: "s3" },
      { time: "2026-08-04T22:00:00", showId: "s4" },
    ],
    "2026-08-05": [
      { time: "2026-08-05T11:00:00", showId: "s5" },
      { time: "2026-08-05T20:00:00", showId: "s6" },
    ],
  };

  it("filters showtimes to the evening window", () => {
    const filtered = filterShowtimesByWindow(dateTime, "evening");
    expect(filtered["2026-08-04"]).toHaveLength(1);
    expect(filtered["2026-08-04"][0].showId).toBe("s3");
    expect(filtered["2026-08-05"]).toHaveLength(1);
    expect(filtered["2026-08-05"][0].showId).toBe("s6");
  });

  it("filters showtimes to the morning window", () => {
    const filtered = filterShowtimesByWindow(dateTime, "morning");
    expect(filtered["2026-08-04"]).toHaveLength(1);
    expect(filtered["2026-08-04"][0].showId).toBe("s1");
    expect(filtered["2026-08-05"]).toHaveLength(1);
    expect(filtered["2026-08-05"][0].showId).toBe("s5");
  });

  it("returns the original map when no window is given", () => {
    const filtered = filterShowtimesByWindow(dateTime, null);
    expect(filtered).toEqual(dateTime);
  });
});

describe("findFirstAvailableShowtime", () => {
  const dateTime = {
    "2026-08-04": [
      { time: "2026-08-04T10:00:00", showId: "s1", isSoldOut: true },
      { time: "2026-08-04T14:00:00", showId: "s2", isSoldOut: false },
    ],
    "2026-08-05": [
      { time: "2026-08-05T11:00:00", showId: "s3", isSoldOut: false },
    ],
  };

  it("finds the first available showtime", () => {
    const result = findFirstAvailableShowtime(dateTime, null);
    expect(result.date).toBe("2026-08-04");
    expect(result.showtime.showId).toBe("s2");
  });

  it("finds the first available showtime in a time window", () => {
    const result = findFirstAvailableShowtime(dateTime, "morning");
    expect(result.date).toBe("2026-08-05");
    expect(result.showtime.showId).toBe("s3");
  });

  it("returns null when no showtimes match", () => {
    const result = findFirstAvailableShowtime(dateTime, "night");
    expect(result).toBeNull();
  });
});

describe("summarizeParsedQuery", () => {
  it("builds a readable summary", () => {
    const parsed = {
      seats: 2,
      genre: "comedy",
      timeWindow: "evening",
      location: "andheri",
    };
    const summary = summarizeParsedQuery(parsed);
    expect(summary).toContain("2 seats");
    expect(summary).toContain("comedy movie");
    expect(summary).toContain("evening");
    expect(summary).toContain("andheri");
  });

  it("handles an empty parse", () => {
    const summary = summarizeParsedQuery({});
    expect(summary).toContain("couldn't find");
  });
});