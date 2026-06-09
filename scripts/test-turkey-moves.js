const { parseMove, resolveSpring1901 } = require('../dist/move-resolution');

// Turkey's starting units
const turkeyUnits = [
  { type: 'A', location: 'Constantinople' },
  { type: 'A', location: 'Smyrna' },
  { type: 'F', location: 'Ankara' }
];

// Parse Turkey's moves
const moves = [
  parseMove('A Constantinople to Bulgaria', 'Turkey', turkeyUnits),
  parseMove('A Smyrna to Ankara', 'Turkey', turkeyUnits),
  parseMove('F Ankara to Constantinople', 'Turkey', turkeyUnits)
];

console.log('\n=== VALIDATION PHASE ===\n');
moves.forEach((move, i) => {
  if (move) {
    const status = move.valid ? '✓ VALID' : `✗ INVALID - ${move.invalidReason}`;
    console.log(`${i + 1}. ${move.unit.type} ${move.from} to ${move.to || 'HOLD'} - ${status}`);
  }
});

console.log('\n=== RESOLUTION PHASE ===\n');
const results = resolveSpring1901(moves.filter(m => m !== null));

results.forEach((result) => {
  const status = result.success ? '✓ SUCCESS' : `✗ FAILED - ${result.reason}`;
  console.log(`${result.unit.type} ${result.from} to ${result.to} - ${status}`);
});

console.log('\n=== EXPECTED RESULTS ===\n');
console.log('All three moves should be VALID and SUCCESS');
console.log('Final positions:');
console.log('  - A Bulgaria (moved from Constantinople)');
console.log('  - A Ankara (moved from Smyrna)');
console.log('  - F Constantinople (moved from Ankara)');
