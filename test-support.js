const { resolveSpring1901, parseMove } = require('./dist/move-resolution');

// Test the Rumania scenario
const startingUnits = {
  'Russia': [
    { type: 'A', location: 'Ukraine' },
    { type: 'A', location: 'Galicia' },
    { type: 'F', location: 'Sevastopol' },
    { type: 'F', location: 'Gulf of Bothnia' }
  ],
  'Austria-Hungary': [
    { type: 'A', location: 'Vienna' },
    { type: 'A', location: 'Budapest' },
    { type: 'F', location: 'Trieste' }
  ]
};

const moveTexts = [
  { country: 'Russia', text: 'A Ukraine to Rumania' },
  { country: 'Russia', text: 'A Galicia supports Ukraine to Rumania' },
  { country: 'Austria-Hungary', text: 'A Budapest to Rumania' }
];

const moves = [];
for (const { country, text } of moveTexts) {
  const move = parseMove(text, country, startingUnits[country]);
  if (move) {
    console.log(`Parsed: ${country} - ${text}`);
    console.log(`  from: "${move.from}", to: "${move.to}", action: "${move.action}"`);
    if (move.supportTarget) {
      console.log(`  supportTarget: from="${move.supportTarget.from}", to="${move.supportTarget.to}"`);
    }
    moves.push(move);
  }
}

console.log('\n=== Resolving Moves ===\n');
const results = resolveSpring1901(moves);

console.log('\n=== Results ===\n');
for (const result of results) {
  console.log(`${result.country}: ${result.unit.type} ${result.from}${result.to ? ' to ' + result.to : ''} - ${result.success ? 'SUCCESS' : 'FAILED'} [Strength: ${result.strength}]`);
  if (result.reason) {
    console.log(`  Reason: ${result.reason}`);
  }
}
