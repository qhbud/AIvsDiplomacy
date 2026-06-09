const fs = require('fs');
const path = require('path');
const { drawMapWithUnits } = require('../dist/draw-map');

async function regenerateMaps() {
  const spring1910Dir = 'diplomacy-games/game-2025-12-20T04-57-53-169Z/spring-1910';
  const resolutionFile = path.join(spring1910Dir, 'moves-and-resolution.txt');

  // Parse unit positions from resolution file
  const resolutionText = fs.readFileSync(resolutionFile, 'utf-8');

  // Get unit positions from "## Final Unit Positions" section
  const finalSection = resolutionText.match(/## Final Unit Positions\n\n([\s\S]*?)$/);
  if (!finalSection) {
    console.error('Could not find Final Unit Positions section');
    return;
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
      unitPositions[country].push(`${type} ${location}`);
    }
  }

  console.log('Parsed unit positions:');
  for (const [country, units] of Object.entries(unitPositions)) {
    console.log(`  ${country}: ${units.length} units`);
  }

  // Generate pre-move map (use previous turn's final positions)
  const winter1909Dir = 'diplomacy-games/game-2025-12-20T04-57-53-169Z/winter-1909';
  const winter1909Resolution = path.join(winter1909Dir, 'moves-and-resolution.txt');
  const winter1909Text = fs.readFileSync(winter1909Resolution, 'utf-8');

  const winter1909Final = winter1909Text.match(/## Final Unit Positions\n\n([\s\S]*?)$/);
  const prePositions = {};

  if (winter1909Final) {
    const preLines = winter1909Final[1].split('\n');
    for (const line of preLines) {
      const match = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+-\s+Final position/);
      if (match) {
        const country = match[1];
        const type = match[2];
        const location = match[3];

        if (!prePositions[country]) {
          prePositions[country] = [];
        }
        prePositions[country].push(`${type} ${location}`);
      }
    }
  }

  // Generate maps
  const preMapPath = path.join(spring1910Dir, 'spring-1910-pre.png');
  const postMapPath = path.join(spring1910Dir, 'spring-1910-post.png');

  // Convert string arrays to proper unit format
  const convertToUnitFormat = (positions) => {
    const result = {};
    for (const [country, units] of Object.entries(positions)) {
      result[country] = units.map(unitStr => {
        const match = unitStr.match(/([AF])\s+(.+)/);
        if (match) {
          return { type: match[1], location: match[2].trim() };
        }
        return null;
      }).filter(u => u !== null);
    }
    return result;
  };

  const preUnits = convertToUnitFormat(prePositions);
  const postUnits = convertToUnitFormat(unitPositions);

  console.log('\nGenerating pre-move map...');
  drawMapWithUnits(preMapPath, preUnits);
  console.log(`✓ Saved: ${preMapPath}`);

  console.log('\nGenerating post-move map...');
  drawMapWithUnits(postMapPath, postUnits);
  console.log(`✓ Saved: ${postMapPath}`);

  console.log('\n✅ Maps regenerated successfully!');
}

regenerateMaps().catch(console.error);
