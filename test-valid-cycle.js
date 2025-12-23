// Test for valid movement cycles
// A->B->C->A should all succeed (valid 3-way cycle)

const { parseMove, resolveSpring1901 } = require('./dist/move-resolution');

const unitPositions = {
  'France': [
    { type: 'A', location: 'Paris' },
    { type: 'A', location: 'Burgundy' },
    { type: 'A', location: 'Gascony' }
  ]
};

const moves = [];

// Create a 3-way cycle: Paris->Burgundy->Gascony->Paris
moves.push(parseMove('A Paris to Burgundy', 'France', unitPositions['France']));
moves.push(parseMove('A Burgundy to Gascony', 'France', unitPositions['France']));
moves.push(parseMove('A Gascony to Paris', 'France', unitPositions['France']));

console.log('\n=== MOVES (3-way cycle) ===');
moves.forEach(m => {
  if (m) console.log(`${m.country} ${m.unit.type} ${m.from} -> ${m.to || 'HOLD'} [${m.action}]`);
});

const results = resolveSpring1901(moves, unitPositions);

console.log('\n=== RESULTS ===');
results.forEach(r => {
  const status = r.success ? '✓ SUCCESS' : '✗ FAILED';
  console.log(`${r.country} ${r.unit.type} ${r.from} -> ${r.to || 'HOLD'}: ${status}`);
  if (r.reason) console.log(`  Reason: ${r.reason}`);
});

console.log('\n=== EXPECTED ===');
console.log('All 3 moves should succeed (valid cycle)');
console.log('France A Paris -> Burgundy: ✓ SUCCESS');
console.log('France A Burgundy -> Gascony: ✓ SUCCESS');
console.log('France A Gascony -> Paris: ✓ SUCCESS');

console.log('\n=== TEST RESULT ===');
const allSucceeded = results.every(r => r.success);
console.log(allSucceeded ? '✓ PASS: Valid cycle works!' : '✗ FAIL: Valid cycle broken!');
