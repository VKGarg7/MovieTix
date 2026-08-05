import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, extname } from "path";

const SRC_DIR = join(process.cwd(), "client", "src");
const fixed = [];
const skipped = [];

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (extname(entry.name) === ".jsx" || extname(entry.name) === ".js") {
      processFile(full);
    }
  }
}

function processFile(filePath) {
  const content = readFileSync(filePath, "utf8");

  // Check if file uses motion. in JSX
  if (!/\bmotion\.(div|button|span|p|a|section|nav|ul|li|img|svg|form|input|label|h1|h2|h3|h4|h5|h6|main|header|footer|aside|article|figure|figcaption|table|tr|td|th|select|option|textarea|video|audio|canvas|picture|source|iframe|embed|object|param|track|map|area|details|summary|dialog|menu|menuitem|optgroup|progress|meter|output|fieldset|legend|datalist|keygen|time|mark|ruby|rt|rp|bdi|bdo|wbr|br|hr|abbr|address|blockquote|cite|code|del|dfn|em|i|ins|kbd|pre|q|s|samp|small|strong|sub|sup|u|var|template|slot|portal|group|path|circle|rect|line|polyline|polygon|ellipse|text|tspan|g|defs|symbol|use|clipPath|mask|pattern|linearGradient|radialGradient|stop|filter|feGaussianBlur|feOffset|feBlend|feColorMatrix|feComponentTransfer|feComposite|feConvolveMatrix|feDiffuseLighting|feDisplacementMap|feDistantLight|feDropShadow|feFlood|feFuncA|feFuncB|feFuncG|feFuncR|feImage|feMerge|feMergeNode|feMorphology|fePointLight|feSpecularLighting|feSpotLight|feTile|feTurbulence|foreignObject|animate|animateMotion|animateTransform|mpath)\b/.test(content)) {
    return;
  }

  // Check if motion is already imported from framer-motion
  const framerImportMatch = content.match(/import\s*\{([^}]*)\}\s*from\s*["']framer-motion["']/);
  if (framerImportMatch) {
    const importedNames = framerImportMatch[1].split(",").map((s) => s.trim());
    if (importedNames.includes("motion")) {
      return; // already has motion
    }
    // Has framer-motion import but no motion - should have been caught by first script
    skipped.push(`${filePath}: has framer-motion import but no motion`);
    return;
  }

  // No framer-motion import at all - add one
  // Find the first import statement to insert after
  const importMatch = content.match(/^import\s+[^\n]+$/m);
  if (!importMatch) {
    skipped.push(`${filePath}: no import statements found`);
    return;
  }

  const newContent = content.replace(
    /^import\s+[^\n]+$/m,
    (match) => `${match}\nimport { motion } from "framer-motion";`
  );

  writeFileSync(filePath, newContent);
  fixed.push(`${filePath}: added motion import`);
}

walk(SRC_DIR);

console.log("=== FIXED ===");
fixed.forEach((f) => console.log(f));
console.log(`\nTotal fixed: ${fixed.length}`);
if (skipped.length > 0) {
  console.log("\n=== SKIPPED ===");
  skipped.forEach((s) => console.log(s));
}