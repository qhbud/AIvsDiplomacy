const fs = require('fs');
const path = require('path');

const seasonMapsDir = 'season-maps';

// Define seasons in chronological order
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

console.log('Renaming season maps for chronological alphabetical sorting...\n');

seasons.forEach((season, index) => {
  const oldName = `${season}-post.png`;
  const oldPath = path.join(seasonMapsDir, oldName);

  // Use 2-digit numbering (01, 02, ..., 28)
  const newNumber = String(index + 1).padStart(2, '0');
  const newName = `${newNumber}-${season}.png`;
  const newPath = path.join(seasonMapsDir, newName);

  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`✓ ${oldName} → ${newName}`);
  } else {
    console.log(`⚠️  ${oldName} not found, skipping...`);
  }
});

console.log('\n✅ All maps renamed successfully!');
console.log('📁 Maps are now sorted chronologically when listed alphabetically.');
