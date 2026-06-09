// Regenerate Fall 1910 maps with correct SC ownership
const fs = require('fs');
const path = require('path');
const { drawMapWithUnits } = require('../dist/draw-map');
const { calculateSupplyCenterOwnership } = require('../dist/move-resolution');

const gameDir = 'C:\\Users\\Quinn\\Desktop\\AIvsDiplomacy\\diplomacy-games\\game-2025-12-20T04-57-53-169Z';
const fall1910Dir = path.join(gameDir, 'fall-1910');
const spring1910Dir = path.join(gameDir, 'spring-1910');

// Read Spring 1910 final positions for Fall 1910 pre-map
const spring1910File = path.join(spring1910Dir, 'moves-and-resolution.txt');
const spring1910Content = fs.readFileSync(spring1910File, 'utf-8');

// Parse Spring 1910 SC ownership
function parseScOwnership(content) {
  const scOwnership = {};
  const scSection = content.match(/## Supply Center Ownership\n\n([\s\S]*?)(?=\n## |$)/);
  if (scSection) {
    const lines = scSection[1].split('\n');
    for (const line of lines) {
      const match = line.match(/(.+?):\s+\d+\s+supply centers\s+-\s+\[(.+)\]/);
      if (match) {
        const country = match[1].trim();
        const scs = match[2].split(',').map(s => s.trim());
        for (const sc of scs) {
          scOwnership[sc] = country;
        }
      }
    }
  }
  return scOwnership;
}

// Parse unit positions
function parseUnitPositions(content) {
  const unitPositions = {
    'England': [],
    'France': [],
    'Germany': [],
    'Italy': [],
    'Austria-Hungary': [],
    'Russia': [],
    'Turkey': []
  };

  const finalPosSection = content.match(/## Final Unit Positions\n\n([\s\S]*?)$/);
  if (finalPosSection) {
    const lines = finalPosSection[1].split('\n');
    for (const line of lines) {
      const match = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+-\s+Final position/);
      if (match) {
        const country = match[1].trim();
        const type = match[2];
        const location = match[3].trim();
        if (unitPositions[country]) {
          unitPositions[country].push({ type, location });
        }
      }
    }
  }

  return unitPositions;
}

// Spring 1910 final positions = Fall 1910 starting positions
const spring1910ScOwnership = parseScOwnership(spring1910Content);
const fall1910PreUnits = parseUnitPositions(spring1910Content);

console.log('Spring 1910 SC Ownership (Fall 1910 pre):');
console.log(spring1910ScOwnership);
console.log('\nFall 1910 pre units:');
for (const [country, units] of Object.entries(fall1910PreUnits)) {
  console.log(`  ${country}: ${units.length} units`);
}

// Generate Fall 1910 pre-map
const fall1910PreMapPath = path.join(fall1910Dir, 'fall-1910-pre.png');
drawMapWithUnits(fall1910PreMapPath, fall1910PreUnits, undefined, spring1910ScOwnership);
console.log(`\n✓ Generated ${fall1910PreMapPath}`);

// Read Fall 1910 final positions for post-map
const fall1910File = path.join(fall1910Dir, 'moves-and-resolution.txt');
const fall1910Content = fs.readFileSync(fall1910File, 'utf-8');

const fall1910ScOwnership = parseScOwnership(fall1910Content);
const fall1910PostUnits = parseUnitPositions(fall1910Content);

console.log('\nFall 1910 SC Ownership (Fall 1910 post):');
console.log(fall1910ScOwnership);
console.log('\nFall 1910 post units:');
for (const [country, units] of Object.entries(fall1910PostUnits)) {
  console.log(`  ${country}: ${units.length} units`);
}

// Generate Fall 1910 post-map
const fall1910PostMapPath = path.join(fall1910Dir, 'fall-1910-post.png');
drawMapWithUnits(fall1910PostMapPath, fall1910PostUnits, undefined, fall1910ScOwnership);
console.log(`\n✓ Generated ${fall1910PostMapPath}`);

console.log('\n✅ Fall 1910 maps regenerated successfully!');
