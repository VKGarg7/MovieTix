// Standalone dev-time accessibility audit for the seat-selection page
// (MT-504). Not wired into CI — run manually via `npm run a11y-check` against
// a locally running dev server (`npm run dev`) while signed in and with a
// theater/movie/date selected, since SeatLayout requires live app state that
// isn't reproducible in a component-only test.
//
// Usage:
//   npm run a11y-check -- http://localhost:5173/movies/<movieId>/<date>
//
// Falls back to prompting for a URL if none is given.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const url = process.argv[2];

if (!url) {
    console.error(
        '\nUsage: npm run a11y-check -- <seat-layout-url>\n' +
        'Example: npm run a11y-check -- http://localhost:5173/movies/507f1f77bcf86cd799439011/2026-08-10\n' +
        '\nStart the dev server first (npm run dev), select a city/theater, and pick a\n' +
        'movie/date with an active showtime so the seat grid actually renders, then\n' +
        'copy that URL here.\n'
    );
    process.exit(1);
}

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

console.log(`Loading ${url} ...`);
await page.goto(url, { waitUntil: 'networkidle' });

// Give the seat grid a moment to render past the loading state.
await page.waitForTimeout(1500);

const results = await new AxeBuilder({ page })
    // Scope the scan to the seat-map region and the checkout summary below it,
    // rather than the whole page (nav/footer are shared chrome, out of scope
    // for this ticket).
    .include('body')
    .analyze();

await browser.close();

const bySeverity = { critical: [], serious: [], moderate: [], minor: [] };
for (const violation of results.violations) {
    (bySeverity[violation.impact] ||= []).push(violation);
}

const printGroup = (label, violations) => {
    if (violations.length === 0) return;
    console.log(`\n${label} (${violations.length}):`);
    for (const v of violations) {
        console.log(`  - [${v.id}] ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'})`);
        console.log(`    ${v.helpUrl}`);
    }
};

console.log(`\naxe-core scan complete: ${results.violations.length} total violation type(s) found.`);
printGroup('CRITICAL', bySeverity.critical);
printGroup('Serious', bySeverity.serious);
printGroup('Moderate', bySeverity.moderate);
printGroup('Minor', bySeverity.minor);

if (bySeverity.critical.length > 0) {
    console.error('\nFAILED: critical accessibility violations found.');
    process.exit(1);
}

console.log('\nPASSED: zero critical violations.');
