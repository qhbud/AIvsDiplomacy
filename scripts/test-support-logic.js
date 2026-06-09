/**
 * Test Suite for Diplomacy Support, Defense, and Attack Logic
 *
 * This tests the core rules of Diplomacy:
 * 1. Support validation - supporting unit must be able to legally move to the destination
 * 2. Attack strength calculation
 * 3. Defense strength calculation
 * 4. Support cutting rules
 */

const { parseMove, resolveSpring1901 } = require('../dist/move-resolution');

// Test colors
const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';

let testsRun = 0;
let testsPassed = 0;

function test(name, fn) {
  testsRun++;
  try {
    fn();
    console.log(`${PASS} ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`${FAIL} ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log('\n=== Testing Support Validation ===\n');

// Test 1: Valid adjacent support - Berlin IS adjacent to Kiel
test('Valid adjacent support - A Berlin supports A Munich to Kiel', () => {
  const units = [
    { type: 'A', location: 'Berlin' },
    { type: 'A', location: 'Munich' }
  ];

  const move = parseMove('A Berlin supports A Munich to Kiel', 'Germany', units);
  assert(move !== null, 'Move should parse');
  assert(move.valid === true, `Support should be valid, but got: ${move.invalidReason}`);
});

// Test 2: Invalid non-adjacent support - Ruhr is not adjacent to Denmark
test('Invalid non-adjacent support - A Ruhr supports F Kiel to Denmark', () => {
  const units = [
    { type: 'A', location: 'Ruhr' },
    { type: 'F', location: 'Kiel' }
  ];

  const move = parseMove('A Ruhr supports F Kiel to Denmark', 'Germany', units);
  assert(move !== null, 'Move should parse');
  assert(move.valid === false, 'Support should be invalid - Ruhr not adjacent to Denmark');
  assert(move.invalidReason.includes('not adjacent'), `Expected adjacency error, got: ${move.invalidReason}`);
});

// Test 3: Valid adjacent support from Ruhr to Belgium
test('Valid adjacent support - A Ruhr supports A Belgium HOLD', () => {
  const units = [
    { type: 'A', location: 'Ruhr' },
    { type: 'A', location: 'Belgium' }
  ];

  const move = parseMove('A Ruhr supports A Belgium HOLD', 'Germany', units);
  assert(move !== null, 'Move should parse');
  assert(move.valid === true, `Support should be valid, but got: ${move.invalidReason}`);
});

// Test 4: Army cannot support into water
test('Invalid army supporting into water - A Berlin supports F Kiel to Baltic Sea', () => {
  const units = [
    { type: 'A', location: 'Berlin' },
    { type: 'F', location: 'Kiel' }
  ];

  const move = parseMove('A Berlin supports F Kiel to Baltic Sea', 'Germany', units);
  assert(move !== null, 'Move should parse');
  assert(move.valid === false, 'Support should be invalid - Army cannot support into water');
  assert(move.invalidReason.includes('water'), `Expected water error, got: ${move.invalidReason}`);
});

// Test 5: Fleet can support into adjacent water
test('Valid fleet support into water - F North Sea supports F Holland to Helgoland Bight', () => {
  const units = [
    { type: 'F', location: 'North Sea' },
    { type: 'F', location: 'Holland' }
  ];

  const move = parseMove('F North Sea supports F Holland to Helgoland Bight', 'Germany', units);
  assert(move !== null, 'Move should parse');
  assert(move.valid === true, `Support should be valid, but got: ${move.invalidReason}`);
});

console.log('\n=== Testing Attack and Defense Strength ===\n');

// Test 6: Simple attack with support
test('Attack with support should succeed (strength 2 vs 1)', () => {
  const moves = [
    { country: 'Germany', unit: { type: 'F', location: 'Kiel' }, from: 'Kiel', to: 'Denmark', action: 'move', valid: true },
    { country: 'Germany', unit: { type: 'A', location: 'Munich' }, from: 'Munich', action: 'support', supportTarget: { from: 'Kiel', to: 'Denmark' }, valid: true },
    { country: 'England', unit: { type: 'F', location: 'Denmark' }, from: 'Denmark', action: 'hold', valid: true }
  ];

  const allUnits = {
    'Germany': [{ type: 'F', location: 'Kiel' }, { type: 'A', location: 'Munich' }],
    'England': [{ type: 'F', location: 'Denmark' }]
  };

  const results = resolveSpring1901(moves, allUnits);

  const kielMove = results.find(r => r.from === 'Kiel');
  const denmarkHold = results.find(r => r.from === 'Denmark' && r.action === 'hold');

  assert(kielMove.success === true, 'Kiel to Denmark should succeed with support');
  assert(kielMove.strength === 2, `Attack strength should be 2, got ${kielMove.strength}`);
  assert(denmarkHold.dislodged === true, 'Denmark should be dislodged');
});

// Test 7: Bounced attack - equal strength
test('Attack bounces with equal strength (1 vs 1)', () => {
  const moves = [
    { country: 'Germany', unit: { type: 'F', location: 'Kiel' }, from: 'Kiel', to: 'Denmark', action: 'move', valid: true },
    { country: 'England', unit: { type: 'F', location: 'Denmark' }, from: 'Denmark', action: 'hold', valid: true }
  ];

  const allUnits = {
    'Germany': [{ type: 'F', location: 'Kiel' }],
    'England': [{ type: 'F', location: 'Denmark' }]
  };

  const results = resolveSpring1901(moves, allUnits);

  const kielMove = results.find(r => r.from === 'Kiel');
  const denmarkHold = results.find(r => r.from === 'Denmark');

  assert(kielMove.success === false, 'Kiel to Denmark should fail - equal strength');
  assert(denmarkHold.success === true, 'Denmark should hold successfully');
  assert(!denmarkHold.dislodged, 'Denmark should not be dislodged');
});

// Test 8: Defensive support
test('Defensive support holds against attack (strength 2 vs 1)', () => {
  const moves = [
    { country: 'Germany', unit: { type: 'F', location: 'Kiel' }, from: 'Kiel', to: 'Denmark', action: 'move', valid: true },
    { country: 'England', unit: { type: 'F', location: 'Denmark' }, from: 'Denmark', action: 'hold', valid: true },
    { country: 'England', unit: { type: 'F', location: 'North Sea' }, from: 'North Sea', action: 'support', supportTarget: { from: 'Denmark', to: 'Denmark' }, valid: true }
  ];

  const allUnits = {
    'Germany': [{ type: 'F', location: 'Kiel' }],
    'England': [{ type: 'F', location: 'Denmark' }, { type: 'F', location: 'North Sea' }]
  };

  const results = resolveSpring1901(moves, allUnits);

  const kielMove = results.find(r => r.from === 'Kiel');
  const denmarkHold = results.find(r => r.from === 'Denmark');

  assert(kielMove.success === false, 'Attack should fail against defensive support');
  assert(denmarkHold.success === true, 'Defended hold should succeed');
  assert(!denmarkHold.dislodged, 'Denmark should not be dislodged');
});

console.log('\n=== Testing Support Cutting ===\n');

// Test 9: Support is cut by attack
test('Support is cut when supporting unit is attacked', () => {
  const moves = [
    { country: 'Germany', unit: { type: 'F', location: 'Kiel' }, from: 'Kiel', to: 'Denmark', action: 'move', valid: true },
    { country: 'Germany', unit: { type: 'A', location: 'Munich' }, from: 'Munich', action: 'support', supportTarget: { from: 'Kiel', to: 'Denmark' }, valid: true },
    { country: 'France', unit: { type: 'A', location: 'Burgundy' }, from: 'Burgundy', to: 'Munich', action: 'move', valid: true },
    { country: 'England', unit: { type: 'F', location: 'Denmark' }, from: 'Denmark', action: 'hold', valid: true }
  ];

  const allUnits = {
    'Germany': [{ type: 'F', location: 'Kiel' }, { type: 'A', location: 'Munich' }],
    'France': [{ type: 'A', location: 'Burgundy' }],
    'England': [{ type: 'F', location: 'Denmark' }]
  };

  const results = resolveSpring1901(moves, allUnits);

  const kielMove = results.find(r => r.from === 'Kiel');

  // Support is cut, so attack is now strength 1 vs 1
  assert(kielMove.success === false, 'Attack should fail when support is cut');
  assert(kielMove.strength === 1, `Attack strength should be 1 when support cut, got ${kielMove.strength}`);
});

// Test 10: Support is NOT cut by attack from province being supported
test('Support is NOT cut by attack from supported destination', () => {
  const moves = [
    { country: 'Germany', unit: { type: 'F', location: 'Kiel' }, from: 'Kiel', to: 'Denmark', action: 'move', valid: true },
    { country: 'Germany', unit: { type: 'A', location: 'Munich' }, from: 'Munich', action: 'support', supportTarget: { from: 'Kiel', to: 'Denmark' }, valid: true },
    { country: 'England', unit: { type: 'F', location: 'Denmark' }, from: 'Denmark', to: 'Munich', action: 'move', valid: true }
  ];

  const allUnits = {
    'Germany': [{ type: 'F', location: 'Kiel' }, { type: 'A', location: 'Munich' }],
    'England': [{ type: 'F', location: 'Denmark' }]
  };

  const results = resolveSpring1901(moves, allUnits);

  const kielMove = results.find(r => r.from === 'Kiel');

  // Support is NOT cut because attack comes from Denmark (the province being supported to)
  assert(kielMove.success === true, 'Attack should succeed - support not cut by defender');
  assert(kielMove.strength === 2, `Attack strength should be 2, got ${kielMove.strength}`);
});

console.log('\n=== Testing Complex Scenarios ===\n');

// Test 11: Multiple supports for same attack
test('Multiple supports stack for same attack', () => {
  const moves = [
    { country: 'Germany', unit: { type: 'F', location: 'Kiel' }, from: 'Kiel', to: 'Denmark', action: 'move', valid: true },
    { country: 'Germany', unit: { type: 'A', location: 'Munich' }, from: 'Munich', action: 'support', supportTarget: { from: 'Kiel', to: 'Denmark' }, valid: true },
    { country: 'Germany', unit: { type: 'A', location: 'Berlin' }, from: 'Berlin', action: 'support', supportTarget: { from: 'Kiel', to: 'Denmark' }, valid: true },
    { country: 'England', unit: { type: 'F', location: 'Denmark' }, from: 'Denmark', action: 'hold', valid: true }
  ];

  const allUnits = {
    'Germany': [
      { type: 'F', location: 'Kiel' },
      { type: 'A', location: 'Munich' },
      { type: 'A', location: 'Berlin' }
    ],
    'England': [{ type: 'F', location: 'Denmark' }]
  };

  const results = resolveSpring1901(moves, allUnits);

  const kielMove = results.find(r => r.from === 'Kiel');

  assert(kielMove.success === true, 'Attack with 2 supports should succeed');
  assert(kielMove.strength === 3, `Attack strength should be 3, got ${kielMove.strength}`);
});

// Test 12: Standoff - two units moving to same location
test('Standoff when two units move to same location with equal strength', () => {
  const moves = [
    { country: 'Germany', unit: { type: 'A', location: 'Kiel' }, from: 'Kiel', to: 'Denmark', action: 'move', valid: true },
    { country: 'Russia', unit: { type: 'A', location: 'Sweden' }, from: 'Sweden', to: 'Denmark', action: 'move', valid: true }
  ];

  const allUnits = {
    'Germany': [{ type: 'A', location: 'Kiel' }],
    'Russia': [{ type: 'A', location: 'Sweden' }]
  };

  const results = resolveSpring1901(moves, allUnits);

  const kielMove = results.find(r => r.from === 'Kiel');
  const swedenMove = results.find(r => r.from === 'Sweden');

  assert(kielMove.success === false, 'Kiel should fail in standoff');
  assert(swedenMove.success === false, 'Sweden should fail in standoff');
});

// Summary
console.log(`\n=== Test Results ===`);
console.log(`Tests run: ${testsRun}`);
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsRun - testsPassed}`);

if (testsPassed === testsRun) {
  console.log(`\n${PASS} All tests passed!`);
  process.exit(0);
} else {
  console.log(`\n${FAIL} Some tests failed.`);
  process.exit(1);
}
