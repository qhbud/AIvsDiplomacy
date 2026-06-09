const fs = require('fs');
const path = require('path');
const { drawMapWithUnits } = require('../dist/draw-map');

// Parse unit positions from moves-and-resolution.txt
function parseUnitPositions(resolutionText) {
  const finalSection = resolutionText.match(/## Final Unit Positions\n\n([\s\S]*?)$/);
  if (!finalSection) {
    return null;
  }

  const unitPositions = {};
  const lines = finalSection[1].split('\n');

  for (const line of lines) {
    const match = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+-\s+Final position/);
    if (match) {
      const country = match[1];
      const type = match[2];
      const location = match[3];

      if (!unitPositions[country]) {
        unitPositions[country] = [];
      }
      unitPositions[country].push({ type, location: location.trim() });
    }
  }

  return unitPositions;
}

// Compute final positions from submitted orders and resolution
function computeFinalPositions(resolutionText, initialPositions) {
  // Parse all successful moves
  const resolutionSection = resolutionText.match(/## Resolution\n\n([\s\S]*?)($|##)/);
  if (!resolutionSection) {
    console.warn('Could not find Resolution section');
    return initialPositions;
  }

  const positions = JSON.parse(JSON.stringify(initialPositions)); // Deep copy
  const lines = resolutionSection[1].split('\n');

  for (const line of lines) {
    // Match successful moves: **Country**: TYPE Location to Destination - ✓ SUCCESS
    const moveMatch = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+to\s+(.+?)\s+-\s+✓ SUCCESS/);
    if (moveMatch) {
      const country = moveMatch[1];
      const type = moveMatch[2];
      const from = moveMatch[3].trim();
      const to = moveMatch[4].split('-')[0].trim(); // Remove any trailing comments

      if (!positions[country]) {
        positions[country] = [];
      }

      // Find and update the unit
      const unitIndex = positions[country].findIndex(u => u.location === from && u.type === type);
      if (unitIndex >= 0) {
        positions[country][unitIndex].location = to;
      }
    }

    // Match holds (units stay in place): **Country**: TYPE Location HOLD - ✓ SUCCESS
    const holdMatch = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+HOLD\s+-\s+✓ SUCCESS/);
    if (holdMatch) {
      // Unit stays in place, no action needed
    }

    // Match failed moves (units stay in place)
    const failedMatch = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+to\s+.+?\s+-\s+✗ FAILED/);
    if (failedMatch) {
      // Unit stays in place, no action needed
    }
  }

  return positions;
}

// Parse initial positions from submitted orders
function parseInitialPositions(resolutionText) {
  const ordersSection = resolutionText.match(/## Submitted Orders\n\n([\s\S]*?)## Resolution/);
  if (!ordersSection) {
    return null;
  }

  const positions = {};
  const lines = ordersSection[1].split('\n');

  for (const line of lines) {
    // Match orders: **Country**: TYPE Location ...
    const match = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+(to|HOLD|Convoys|Supports)/);
    if (match) {
      const country = match[1];
      const type = match[2];
      const location = match[3].trim();

      if (!positions[country]) {
        positions[country] = [];
      }

      // Only add if not already in list (avoid duplicates)
      if (!positions[country].some(u => u.location === location && u.type === type)) {
        positions[country].push({ type, location });
      }
    }
  }

  return positions;
}

async function generateAllSeasonMaps() {
  const gameDir = 'diplomacy-games/game-2025-12-20T04-57-53-169Z';
  const outputDir = 'season-maps';

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // List of all seasons in order
  const seasons = [
    'spring-1901', 'fall-1901', 'winter-1901',
    'spring-1902', 'fall-1902', 'winter-1902',
    'spring-1903', 'fall-1903', 'winter-1903',
    'spring-1904', 'fall-1904', 'winter-1904',
    'spring-1905', 'fall-1905', 'winter-1905',
    'spring-1906', 'fall-1906', 'winter-1906',
    'spring-1907', 'fall-1907', 'winter-1907',
    'spring-1908', 'fall-1908', 'winter-1908',
    'spring-1909', 'fall-1909', 'winter-1909',
    'spring-1910'
  ];

  let previousFinalPositions = null;

  for (let i = 0; i < seasons.length; i++) {
    const season = seasons[i];
    const seasonDir = path.join(gameDir, season);
    const resolutionFile = path.join(seasonDir, 'moves-and-resolution.txt');

    if (!fs.existsSync(resolutionFile)) {
      console.log(`⏭️  Skipping ${season} - no resolution file found`);
      continue;
    }

    console.log(`\n📍 Processing ${season}...`);

    const resolutionText = fs.readFileSync(resolutionFile, 'utf-8');

    // Try to parse final positions from file
    let finalPositions = parseUnitPositions(resolutionText);

    // If not found, compute from moves
    if (!finalPositions) {
      const initialPositions = parseInitialPositions(resolutionText) || previousFinalPositions;
      if (initialPositions) {
        finalPositions = computeFinalPositions(resolutionText, initialPositions);
        console.log(`   Computed final positions from moves`);
      } else {
        console.warn(`   ⚠️  Could not determine positions for ${season}`);
        continue;
      }
    }

    // Get pre-move positions (from previous season or parse from orders)
    let prePositions = previousFinalPositions;
    if (!prePositions) {
      prePositions = parseInitialPositions(resolutionText);
    }

    // Generate map (post-move only)
    const mapPath = path.join(outputDir, `${season}.png`);

    // Format season title (e.g., "Spring 1901" or "Fall 1902")
    const seasonParts = season.split('-');
    const seasonName = seasonParts[0].charAt(0).toUpperCase() + seasonParts[0].slice(1);
    const year = seasonParts[1];
    const seasonTitle = `Diplomacy - ${seasonName} ${year}`;

    console.log(`   Generating map...`);
    drawMapWithUnits(mapPath, finalPositions, seasonTitle);
    console.log(`   ✓ Saved: ${mapPath}`);

    // Store final positions for next season
    previousFinalPositions = finalPositions;
  }

  console.log('\n✅ All maps generated successfully!');
  console.log(`📁 Maps saved in: ${path.resolve(outputDir)}`);
}

generateAllSeasonMaps().catch(console.error);
