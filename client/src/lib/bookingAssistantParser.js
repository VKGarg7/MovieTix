/**
 * MT-707 — Conversational booking assistant
 *
 * A constrained slot-filling parser that extracts booking intent from
 * plain-language queries. It deliberately avoids an LLM dependency —
 * most queries in this domain are structured enough for regex/keyword
 * extraction, and it keeps cost/latency out of a checkout-adjacent flow.
 *
 * Extracted slots map 1:1 to the filters the manual UI already uses:
 *   - seat count  -> SeatLayout best-available-seats
 *   - time window -> showtime filtering on SeatLayout
 *   - genre/title -> Movies page genre/search filters
 *   - location    -> theater/city selection
 */

export const MAX_SEATS_PER_BOOKING = 5;

// Time-of-day windows (24h hour ranges, inclusive start, exclusive end)
export const TIME_WINDOWS = {
  morning: { start: 6, end: 12, label: "morning" },
  afternoon: { start: 12, end: 17, label: "afternoon" },
  evening: { start: 17, end: 21, label: "evening" },
  night: { start: 21, end: 24, label: "night" },
};

// Regex patterns for seat-count extraction
const SEAT_PATTERNS = [
  /(\d+)\s*(?:seats?|tickets?|people|persons?|pax)/i,
  /(?:seats?|tickets?|people|persons?|pax)\s*(?:for|of)?\s*(\d+)/i,
];

// Regex patterns for time extraction
const TIME_PATTERNS = [
  // "after 8", "after 8pm", "after 8 pm"
  /(?:after|past|from)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
  // "before 10", "before 10pm"
  /(?:before|by|until|till)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
  // "at 8", "at 8pm", "around 8"
  /(?:at|around|~)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
  // "8pm", "8 pm", "8:30pm"
  /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
];

// Time-of-day keyword patterns
const TIME_OF_DAY_PATTERNS = [
  { pattern: /\b(morning|early)\b/i, window: "morning" },
  { pattern: /\b(afternoon|midday|noon)\b/i, window: "afternoon" },
  { pattern: /\b(evening|dusk)\b/i, window: "evening" },
  { pattern: /\b(night|late)\b/i, window: "night" },
];

const PAST_DATE_PATTERNS = [
  /\b(yesterday|last\s+(?:night|week|month|year)|earlier\s+today)\b/i,
];

const FUTURE_DATE_PATTERNS = [
  /\b(today|tonight|tomorrow|this\s+(?:week|weekend)|next\s+(?:week|weekend|month))\b/i,
];

/**
 * Parse a plain-language booking query into structured slots.
 *
 * @param {string} text - The raw user query, e.g. "2 seats for a comedy tonight after 8"
 * @param {Object} options
 * @param {Array}  options.shows    - Movie objects from the app context (each has title, genres)
 * @param {Array}  options.theaters - Theater objects (each has name, city)
 * @param {Array}  options.cities   - City name strings
 * @returns {Object} Parsed result with slots, confidence, and issues
 */
export function parseBookingQuery(text, { shows = [], theaters = [], cities = [] } = {}) {
  const rawText = text.trim();
  const normalized = rawText.toLowerCase();
  const issues = [];

  const result = {
    rawText,
    seats: null,
    timeWindow: null,
    genre: null,
    title: null,
    location: null,
    confidence: 0,
    issues,
  };

  // --- 1. Detect past-date references (nonsensical for booking) ---
  for (const pattern of PAST_DATE_PATTERNS) {
    if (pattern.test(normalized)) {
      issues.push("That time is in the past — please pick an upcoming showtime");
      break;
    }
  }

  // --- 2. Extract seat count ---
  for (const pattern of SEAT_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      const count = parseInt(match[1], 10);
      if (count < 1) {
        issues.push("Seat count must be at least 1");
      } else if (count > MAX_SEATS_PER_BOOKING) {
        issues.push(`You can only book up to ${MAX_SEATS_PER_BOOKING} seats at a time`);
      } else {
        result.seats = count;
      }
      break;
    }
  }

  // --- 3. Extract time window ---
  // First check for specific times / after / before ("after 8", "8pm", etc.)
  // so they take precedence over time-of-day keywords ("tonight", "evening").
  for (const pattern of TIME_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      let hour = parseInt(match[1], 10);
      const meridiem = match[3]?.toLowerCase();

      if (meridiem === "pm" && hour < 12) hour += 12;
      if (meridiem === "am" && hour === 12) hour = 0;

      // Without an explicit AM/PM, "after 8" / "at 8" / "around 8" in a
      // movie-booking context almost always means PM (evening), not AM.
      if (!meridiem && hour < 12) hour += 12;

      // Map the hour to a time-of-day window
      if (hour >= 6 && hour < 12) result.timeWindow = "morning";
      else if (hour >= 12 && hour < 17) result.timeWindow = "afternoon";
      else if (hour >= 17 && hour < 21) result.timeWindow = "evening";
      else result.timeWindow = "night";
      break;
    }
  }

  // Then fall back to time-of-day keywords ("evening", "night", etc.)
  if (!result.timeWindow) {
    for (const { pattern, window } of TIME_OF_DAY_PATTERNS) {
      if (pattern.test(normalized)) {
        result.timeWindow = window;
        break;
      }
    }
  }

  // --- 4. Extract genre ---
  const genreNames = new Set();
  shows.forEach((movie) => movie.genres?.forEach((g) => genreNames.add(g.name.toLowerCase())));

  for (const genreName of genreNames) {
    if (normalized.includes(genreName)) {
      result.genre = genreName;
      break;
    }
  }

  // --- 5. Extract movie title ---
  const titles = shows.map((movie) => movie.title?.toLowerCase()).filter(Boolean);
  // Sort by length descending so longer titles match first
  titles.sort((a, b) => b.length - a.length);

  for (const title of titles) {
    if (normalized.includes(title)) {
      result.title = title;
      break;
    }
  }

  // --- 6. Extract location (city first, then theater name) ---
  const cityNames = cities.map((c) => c.toLowerCase());
  for (const city of cityNames) {
    if (normalized.includes(city)) {
      result.location = city;
      break;
    }
  }

  if (!result.location) {
    const theaterNames = theaters.map((t) => t.name?.toLowerCase()).filter(Boolean);
    theaterNames.sort((a, b) => b.length - a.length);
    for (const name of theaterNames) {
      if (normalized.includes(name)) {
        result.location = name;
        break;
      }
    }
  }

  // If no exact theater/city match, look for a neighborhood/area that's part
  // of a theater name (e.g. "near Andheri" matches "PVR Andheri").
  if (!result.location) {
    const areaNames = new Set();
    theaters.forEach((t) => {
      const name = t.name?.toLowerCase() || "";
      // Extract the last word(s) of the theater name as a potential area
      const words = name.split(/\s+/);
      if (words.length > 1) {
        areaNames.add(words[words.length - 1]);
      }
    });
    for (const area of areaNames) {
      if (normalized.includes(area)) {
        result.location = area;
        break;
      }
    }
  }

  // --- 7. Compute confidence ---
  let matchedSlots = 0;
  if (result.seats) matchedSlots++;
  if (result.timeWindow) matchedSlots++;
  if (result.genre) matchedSlots++;
  if (result.title) matchedSlots++;
  if (result.location) matchedSlots++;

  // Boost confidence if a future-date indicator was present
  if (FUTURE_DATE_PATTERNS.some((p) => p.test(normalized))) {
    matchedSlots += 0.5;
  }

  result.confidence = Math.min(matchedSlots / 5, 1);

  return result;
}

/**
 * Find movies matching the parsed slots.
 *
 * @param {Object} parsed - Result from parseBookingQuery
 * @param {Array}  shows  - Movie objects from the app context
 * @returns {Array} Matching movie objects
 */
export function findMatchingMovies(parsed, shows) {
  return shows.filter((movie) => {
    if (parsed.title) {
      return movie.title?.toLowerCase() === parsed.title;
    }
    if (parsed.genre) {
      return movie.genres?.some((g) => g.name.toLowerCase() === parsed.genre);
    }
    return true;
  });
}

/**
 * Filter showtimes by a time window.
 *
 * @param {Object} dateTime   - The dateTime map from fetchShowDetails ({ "2026-08-04": [{ time, ... }] })
 * @param {string} timeWindow - One of TIME_WINDOWS keys ("morning", "afternoon", "evening", "night")
 * @returns {Object} Filtered dateTime map
 */
export function filterShowtimesByWindow(dateTime, timeWindow) {
  if (!timeWindow || !TIME_WINDOWS[timeWindow]) return dateTime;

  const { start, end } = TIME_WINDOWS[timeWindow];
  const filtered = {};

  for (const [date, showtimes] of Object.entries(dateTime)) {
    const matching = showtimes.filter((showtime) => {
      const hour = new Date(showtime.time).getHours();
      return hour >= start && hour < end;
    });
    if (matching.length > 0) {
      filtered[date] = matching;
    }
  }

  return filtered;
}

/**
 * Find the first available date + showtime for a movie that fits the time window.
 *
 * @param {Object} dateTime   - The dateTime map from fetchShowDetails
 * @param {string} timeWindow - Optional time window to filter by
 * @returns {{ date: string, showtime: Object } | null}
 */
export function findFirstAvailableShowtime(dateTime, timeWindow) {
  const filtered = timeWindow ? filterShowtimesByWindow(dateTime, timeWindow) : dateTime;

  for (const [date, showtimes] of Object.entries(filtered)) {
    const available = showtimes.find((s) => !s.isSoldOut);
    if (available) {
      return { date, showtime: available };
    }
  }

  return null;
}

/**
 * Build a human-readable summary of what was parsed, for the chat UI.
 *
 * @param {Object} parsed - Result from parseBookingQuery
 * @returns {string} Summary sentence
 */
export function summarizeParsedQuery(parsed) {
  const parts = [];

  if (parsed.seats) {
    parts.push(`${parsed.seats} seat${parsed.seats > 1 ? "s" : ""}`);
  }
  if (parsed.title) {
    parts.push(`"${parsed.title}"`);
  } else if (parsed.genre) {
    parts.push(`${parsed.genre} movie`);
  }
  if (parsed.timeWindow) {
    parts.push(`in the ${parsed.timeWindow}`);
  }
  if (parsed.location) {
    parts.push(`near ${parsed.location}`);
  }

  if (parts.length === 0) {
    return "I couldn't find any booking details in that request.";
  }

  return `Looking for ${parts.join(", ")}.`;
}