const fs = require('fs');

// Read the index.ts file
let content = fs.readFileSync('src/index.ts', 'utf8');

// Pattern to match: for (const countryDir of countryDirs) {
// followed by any line that isn't already a Russia check
const pattern = /for \(const countryDir of countryDirs\) \{\n(?!    \/\/ Skip Russia)/g;

// Replacement: add Russia check after the for loop
const replacement = `for (const countryDir of countryDirs) {
    // Skip Russia - they are eliminated
    if (countryDir === 'Russia') continue;
`;

// Count how many replacements we'll make
const matches = content.match(pattern);
console.log(`Found ${matches ? matches.length : 0} for loops to update`);

// Do the replacement
const newContent = content.replace(pattern, replacement);

// Save the file
fs.writeFileSync('src/index.ts', newContent, 'utf8');

console.log('✓ Added Russia exclusion to all country directory loops');
