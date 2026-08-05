import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const FILES = [
  "src/components/admin/AdminSidebar.jsx",
  "src/components/cinematic/CinemaAmbience.jsx",
  "src/components/cinematic/FooterAmbience.jsx",
  "src/components/cinematic/ProfileMenu.jsx",
  "src/components/MovieCard.jsx",
  "src/components/SeatGrid.jsx",
  "src/components/TheaterCard.jsx",
  "src/pages/admin/AddShows.jsx",
  "src/pages/admin/Dashboard.jsx",
  "src/pages/Movies.jsx",
  "src/pages/Theaters.jsx",
];

for (const relPath of FILES) {
  const filePath = join(process.cwd(), "client", relPath);
  const content = readFileSync(filePath, "utf8");

  // Check if the import was corrupted: has "motion" but missing "useMotionValue"
  const framerImportMatch = content.match(/import\s*\{([^}]*)\}\s*from\s*["']framer-motion["']/);
  if (!framerImportMatch) {
    console.log(`SKIP ${relPath}: no framer-motion import`);
    continue;
  }

  const importedNames = framerImportMatch[1].split(",").map((s) => s.trim());
  const hasMotion = importedNames.includes("motion");
  const hasUseMotionValue = importedNames.includes("useMotionValue");

  // Check if the file actually uses useMotionValue as a hook
  const usesUseMotionValue = /\buseMotionValue\s*\(/.test(content);

  if (usesUseMotionValue && !hasUseMotionValue) {
    // Need to add useMotionValue back
    const newContent = content.replace(
      /import\s*\{([^}]*)\}\s*from\s*["']framer-motion["']/,
      (match, names) => {
        const trimmed = names.trim();
        return `import { useMotionValue, ${trimmed} } from "framer-motion"`;
      }
    );
    writeFileSync(filePath, newContent);
    console.log(`FIXED ${relPath}: restored useMotionValue`);
  } else {
    console.log(`OK ${relPath}: useMotionValue=${hasUseMotionValue}, motion=${hasMotion}`);
  }
}