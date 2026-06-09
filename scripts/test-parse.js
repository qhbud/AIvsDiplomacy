const fs = require('fs');

const resolutionFile = 'diplomacy-games/game-2025-12-18T07-04-38-310Z/spring-1901/moves-and-resolution.txt';
const content = fs.readFileSync(resolutionFile, 'utf-8');

const unitPositions = {
  'England': [],
  'France': [],
  'Germany': [],
  'Italy': [],
  'Austria-Hungary': [],
  'Russia': [],
  'Turkey': []
};

const resolutionMatch = content.match(/## Resolution([\s\S]*)/);
if (resolutionMatch) {
  const resolutionText = resolutionMatch[1];
  const lines = resolutionText.split('\n');

  console.log('Parsing resolution lines:\n');
  for (const line of lines) {
    // Check for HOLD commands first
    const holdMatch = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+HOLD\s+-\s+✓\s+SUCCESS/);
    if (holdMatch) {
      const country = holdMatch[1];
      const unitType = holdMatch[2];
      const location = holdMatch[3];
      console.log(`${country}: ${unitType} ${location} HOLD = ${unitType} ${location}`);
      unitPositions[country].push(`${unitType} ${location}`);
      continue; // Skip to next line
    }

    // Match move lines (must have "to")
    const match = line.match(/\*\*(.+?)\*\*:\s+([AF])\s+(.+?)\s+to\s+(.+?)\s+-\s+(✓|✗)\s+(SUCCESS|FAILED)/);
    if (match) {
      const country = match[1];
      const unitType = match[2];
      const from = match[3];
      const to = match[4];
      const success = match[5] === '✓';

      let finalLocation = from;
      if (success && to) {
        finalLocation = to;
      }

      finalLocation = finalLocation.split(' - ')[0].trim();

      console.log(`${country}: ${unitType} ${from} -> ${to} (${success ? 'SUCCESS' : 'FAILED'}) = ${unitType} ${finalLocation}`);
      unitPositions[country].push(`${unitType} ${finalLocation}`);
    }
  }

  console.log('\n\nFinal unit positions:');
  for (const [country, units] of Object.entries(unitPositions)) {
    if (units.length > 0) {
      console.log(`${country}: ${units.join(', ')}`);
    }
  }
}
