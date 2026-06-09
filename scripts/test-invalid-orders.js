/**
 * Test that units with invalid orders default to HOLD and defend their position
 */

const { resolveSpring1901 } = require('../dist/move-resolution');

const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';

console.log('\n=== Testing Invalid Orders Default to HOLD ===\n');

// Test: F Denmark has invalid support order, should still defend against F Kiel attack
const moves = [
  // England: F Denmark has invalid support (not adjacent to Holland)
  {
    country: 'England',
    unit: { type: 'F', location: 'Denmark' },
    from: 'Denmark',
    action: 'support',
    supportTarget: { from: 'North Sea', to: 'Holland' },
    valid: false,
    invalidReason: 'Denmark is not adjacent to Holland - cannot support move to that destination'
  },
  // Germany: F Kiel tries to attack Denmark
  {
    country: 'Germany',
    unit: { type: 'F', location: 'Kiel' },
    from: 'Kiel',
    to: 'Denmark',
    action: 'move',
    valid: true
  }
];

const allUnits = {
  'England': [{ type: 'F', location: 'Denmark' }],
  'Germany': [{ type: 'F', location: 'Kiel' }]
};

const results = resolveSpring1901(moves, allUnits);

const denmarkResult = results.find(r => r.from === 'Denmark');
const kielResult = results.find(r => r.from === 'Kiel');

console.log('Denmark result:', denmarkResult);
console.log('Kiel result:', kielResult);

if (!denmarkResult) {
  console.log(`${FAIL} Denmark not found in results`);
  process.exit(1);
}

if (!kielResult) {
  console.log(`${FAIL} Kiel not found in results`);
  process.exit(1);
}

// Denmark's invalid support should be recorded as failed
if (denmarkResult.success !== false) {
  console.log(`${FAIL} Denmark's invalid support should have success = false, got ${denmarkResult.success}`);
  process.exit(1);
}

// Kiel's attack should FAIL because Denmark is still there (strength 1 vs 1)
if (kielResult.success !== false) {
  console.log(`${FAIL} Kiel to Denmark should FAIL (bounced by Denmark defending), got success = ${kielResult.success}`);
  console.log(`   Kiel strength: ${kielResult.strength}`);
  console.log(`   Reason: ${kielResult.reason}`);
  process.exit(1);
}

// Denmark should not be dislodged
if (denmarkResult.dislodged) {
  console.log(`${FAIL} Denmark should not be dislodged when holding with strength 1 vs 1`);
  process.exit(1);
}

console.log(`${PASS} Invalid support order correctly defaults to HOLD`);
console.log(`${PASS} Denmark defends its position (strength 1 vs 1 bounces)`);
console.log(`${PASS} Kiel to Denmark correctly fails`);

console.log(`\n${PASS} All tests passed!\n`);
process.exit(0);
