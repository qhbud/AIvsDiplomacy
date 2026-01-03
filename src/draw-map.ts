import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

interface Unit {
  type: 'A' | 'F';
  location: string;
  coast?: string;
}

interface Territory {
  name: string;
  x: number;
  y: number;
  isSupplyCenter: boolean;
  owner?: string;
  isWater?: boolean;
}

// Territory positions (x, y coordinates on a larger canvas with better spacing)
const territories: Record<string, Territory> = {
  // British Isles
  'Edinburgh': { name: 'Edi', x: 280, y: 140, isSupplyCenter: true, owner: 'England' },
  'Liverpool': { name: 'Lvp', x: 200, y: 220, isSupplyCenter: true, owner: 'England' },
  'London': { name: 'Lon', x: 320, y: 280, isSupplyCenter: true, owner: 'England' },
  'Wales': { name: 'Wal', x: 230, y: 280, isSupplyCenter: false, owner: 'England' },
  'Yorkshire': { name: 'Yor', x: 290, y: 200, isSupplyCenter: false, owner: 'England' },
  'Clyde': { name: 'Cly', x: 220, y: 100, isSupplyCenter: false, owner: 'England' },

  // Scandinavia
  'Norway': { name: 'Nwy', x: 500, y: 80, isSupplyCenter: true },
  'Sweden': { name: 'Swe', x: 620, y: 140, isSupplyCenter: true },
  'Denmark': { name: 'Den', x: 520, y: 250, isSupplyCenter: true },
  'Finland': { name: 'Fin', x: 740, y: 80, isSupplyCenter: false },

  // France
  'Brest': { name: 'Bre', x: 160, y: 380, isSupplyCenter: true, owner: 'France' },
  'Paris': { name: 'Par', x: 280, y: 390, isSupplyCenter: true, owner: 'France' },
  'Picardy': { name: 'Pic', x: 320, y: 330, isSupplyCenter: false, owner: 'France' },
  'Marseilles': { name: 'Mar', x: 350, y: 520, isSupplyCenter: true, owner: 'France' },
  'Gascony': { name: 'Gas', x: 220, y: 470, isSupplyCenter: false, owner: 'France' },
  'Burgundy': { name: 'Bur', x: 360, y: 420, isSupplyCenter: false, owner: 'France' },

  // Iberia
  'Spain': { name: 'Spa', x: 140, y: 580, isSupplyCenter: true },
  'Portugal': { name: 'Por', x: 50, y: 620, isSupplyCenter: true },

  // Low Countries & Germany
  'Belgium': { name: 'Bel', x: 360, y: 320, isSupplyCenter: true },
  'Holland': { name: 'Hol', x: 410, y: 280, isSupplyCenter: true },
  'Kiel': { name: 'Kie', x: 490, y: 290, isSupplyCenter: true, owner: 'Germany' },
  'Berlin': { name: 'Ber', x: 600, y: 300, isSupplyCenter: true, owner: 'Germany' },
  'Munich': { name: 'Mun', x: 500, y: 380, isSupplyCenter: true, owner: 'Germany' },
  'Ruhr': { name: 'Ruh', x: 410, y: 340, isSupplyCenter: false, owner: 'Germany' },
  'Silesia': { name: 'Sil', x: 660, y: 350, isSupplyCenter: false, owner: 'Germany' },
  'Prussia': { name: 'Pru', x: 680, y: 270, isSupplyCenter: false, owner: 'Germany' },

  // Italy
  'Piedmont': { name: 'Pie', x: 390, y: 490, isSupplyCenter: false, owner: 'Italy' },
  'Venice': { name: 'Ven', x: 510, y: 500, isSupplyCenter: true, owner: 'Italy' },
  'Tuscany': { name: 'Tus', x: 450, y: 540, isSupplyCenter: false, owner: 'Italy' },
  'Rome': { name: 'Rom', x: 510, y: 590, isSupplyCenter: true, owner: 'Italy' },
  'Naples': { name: 'Nap', x: 580, y: 650, isSupplyCenter: true, owner: 'Italy' },
  'Apulia': { name: 'Apu', x: 610, y: 610, isSupplyCenter: false, owner: 'Italy' },

  // Central Europe
  'Bohemia': { name: 'Boh', x: 570, y: 420, isSupplyCenter: false, owner: 'Austria-Hungary' },
  'Tyrolia': { name: 'Tyr', x: 500, y: 450, isSupplyCenter: false, owner: 'Austria-Hungary' },
  'Vienna': { name: 'Vie', x: 640, y: 450, isSupplyCenter: true, owner: 'Austria-Hungary' },
  'Trieste': { name: 'Tri', x: 590, y: 520, isSupplyCenter: true, owner: 'Austria-Hungary' },
  'Budapest': { name: 'Bud', x: 720, y: 480, isSupplyCenter: true, owner: 'Austria-Hungary' },
  'Galicia': { name: 'Gal', x: 750, y: 400, isSupplyCenter: false, owner: 'Austria-Hungary' },

  // Balkans
  'Serbia': { name: 'Ser', x: 710, y: 540, isSupplyCenter: true },
  'Albania': { name: 'Alb', x: 660, y: 600, isSupplyCenter: false },
  'Greece': { name: 'Gre', x: 740, y: 660, isSupplyCenter: true },
  'Bulgaria': { name: 'Bul', x: 830, y: 600, isSupplyCenter: true },
  'Rumania': { name: 'Rum', x: 860, y: 500, isSupplyCenter: true },

  // Russia
  'St Petersburg': { name: 'StP', x: 840, y: 80, isSupplyCenter: true, owner: 'Russia' },
  'Livonia': { name: 'Lvn', x: 770, y: 220, isSupplyCenter: false, owner: 'Russia' },
  'Moscow': { name: 'Mos', x: 920, y: 240, isSupplyCenter: true, owner: 'Russia' },
  'Warsaw': { name: 'War', x: 750, y: 330, isSupplyCenter: true, owner: 'Russia' },
  'Ukraine': { name: 'Ukr', x: 860, y: 380, isSupplyCenter: false, owner: 'Russia' },
  'Sevastopol': { name: 'Sev', x: 990, y: 480, isSupplyCenter: true, owner: 'Russia' },

  // Turkey
  'Constantinople': { name: 'Con', x: 880, y: 620, isSupplyCenter: true, owner: 'Turkey' },
  'Ankara': { name: 'Ank', x: 1000, y: 650, isSupplyCenter: true, owner: 'Turkey' },
  'Smyrna': { name: 'Smy', x: 900, y: 690, isSupplyCenter: true, owner: 'Turkey' },
  'Armenia': { name: 'Arm', x: 1080, y: 600, isSupplyCenter: false, owner: 'Turkey' },
  'Syria': { name: 'Syr', x: 1080, y: 730, isSupplyCenter: false, owner: 'Turkey' },

  // North Africa
  'Tunis': { name: 'Tun', x: 440, y: 740, isSupplyCenter: true },
  'North Africa': { name: 'NAf', x: 200, y: 780, isSupplyCenter: false },

  // Seas
  'North Sea': { name: 'North Sea', x: 390, y: 200, isSupplyCenter: false, isWater: true },
  'English Channel': { name: 'Eng Ch', x: 260, y: 310, isSupplyCenter: false, isWater: true },
  'Irish Sea': { name: 'Irish Sea', x: 160, y: 260, isSupplyCenter: false, isWater: true },
  'Mid-Atlantic Ocean': { name: 'Mid-Atl', x: 80, y: 480, isSupplyCenter: false, isWater: true },
  'North Atlantic Ocean': { name: 'N Atlantic', x: 100, y: 140, isSupplyCenter: false, isWater: true },
  'Norwegian Sea': { name: 'Norwegian', x: 360, y: 70, isSupplyCenter: false, isWater: true },
  'Barents Sea': { name: 'Barents', x: 740, y: 20, isSupplyCenter: false, isWater: true },
  'Baltic Sea': { name: 'Baltic', x: 650, y: 210, isSupplyCenter: false, isWater: true },
  'Gulf of Bothnia': { name: 'Bothnia', x: 700, y: 130, isSupplyCenter: false, isWater: true },
  'Skagerrak': { name: 'Ska', x: 460, y: 210, isSupplyCenter: false, isWater: true },
  'Helgoland Bight': { name: 'Hel', x: 450, y: 250, isSupplyCenter: false, isWater: true },
  'Adriatic Sea': { name: 'Adriatic', x: 620, y: 570, isSupplyCenter: false, isWater: true },
  'Aegean Sea': { name: 'Aegean', x: 820, y: 690, isSupplyCenter: false, isWater: true },
  'Black Sea': { name: 'Black Sea', x: 950, y: 550, isSupplyCenter: false, isWater: true },
  'Ionian Sea': { name: 'Ionian', x: 650, y: 690, isSupplyCenter: false, isWater: true },
  'Tyrrhenian Sea': { name: 'Tyrrh', x: 470, y: 650, isSupplyCenter: false, isWater: true },
  'Western Med': { name: 'West Med', x: 280, y: 680, isSupplyCenter: false, isWater: true },
  'Gulf of Lyon': { name: 'Gulf Lyon', x: 340, y: 570, isSupplyCenter: false, isWater: true },
  'Eastern Mediterranean': { name: 'East Med', x: 920, y: 750, isSupplyCenter: false, isWater: true },
};

// Territory adjacencies (which territories border each other)
const adjacencies: Record<string, string[]> = {
  // British Isles
  'Clyde': ['Edinburgh', 'Liverpool', 'North Atlantic Ocean', 'Norwegian Sea'],
  'Edinburgh': ['Clyde', 'Yorkshire', 'North Sea', 'Norwegian Sea'],
  'Liverpool': ['Clyde', 'Yorkshire', 'Wales', 'Irish Sea', 'North Atlantic Ocean'],
  'Yorkshire': ['Edinburgh', 'Liverpool', 'Wales', 'London', 'North Sea'],
  'Wales': ['Liverpool', 'Yorkshire', 'London', 'Irish Sea', 'English Channel'],
  'London': ['Yorkshire', 'Wales', 'North Sea', 'English Channel'],

  // Scandinavia
  'Norway': ['St Petersburg', 'Finland', 'Sweden', 'Barents Sea', 'Norwegian Sea', 'North Sea', 'Skagerrak'],
  'Sweden': ['Norway', 'Finland', 'Denmark', 'Gulf of Bothnia', 'Baltic Sea'],
  'Denmark': ['Sweden', 'Kiel', 'Baltic Sea', 'North Sea', 'Skagerrak', 'Helgoland Bight'],
  'Finland': ['Norway', 'Sweden', 'St Petersburg', 'Gulf of Bothnia'],

  // France
  'Brest': ['Picardy', 'Paris', 'Gascony', 'English Channel', 'Mid-Atlantic Ocean'],
  'Picardy': ['Brest', 'Paris', 'Burgundy', 'Belgium', 'English Channel'],
  'Paris': ['Brest', 'Picardy', 'Burgundy', 'Gascony'],
  'Burgundy': ['Paris', 'Picardy', 'Belgium', 'Ruhr', 'Munich', 'Marseilles', 'Gascony'],
  'Gascony': ['Brest', 'Paris', 'Burgundy', 'Marseilles', 'Spain', 'Mid-Atlantic Ocean'],
  'Marseilles': ['Gascony', 'Burgundy', 'Piedmont', 'Spain', 'Gulf of Lyon'],

  // Iberia
  'Spain': ['Portugal', 'Gascony', 'Marseilles', 'Mid-Atlantic Ocean', 'Western Med', 'Gulf of Lyon'],
  'Portugal': ['Spain', 'Mid-Atlantic Ocean'],

  // Low Countries & Germany
  'Belgium': ['Picardy', 'Burgundy', 'Ruhr', 'Holland', 'English Channel', 'North Sea'],
  'Holland': ['Belgium', 'Ruhr', 'Kiel', 'North Sea', 'Helgoland Bight'],
  'Ruhr': ['Belgium', 'Burgundy', 'Munich', 'Kiel', 'Holland'],
  'Kiel': ['Holland', 'Ruhr', 'Munich', 'Berlin', 'Denmark', 'Baltic Sea', 'Helgoland Bight'],
  'Berlin': ['Kiel', 'Munich', 'Silesia', 'Prussia', 'Baltic Sea'],
  'Munich': ['Ruhr', 'Burgundy', 'Kiel', 'Berlin', 'Silesia', 'Bohemia', 'Tyrolia'],
  'Silesia': ['Berlin', 'Munich', 'Bohemia', 'Galicia', 'Warsaw', 'Prussia'],
  'Prussia': ['Berlin', 'Silesia', 'Warsaw', 'Livonia', 'Baltic Sea'],

  // Italy
  'Piedmont': ['Marseilles', 'Tyrolia', 'Venice', 'Tuscany', 'Gulf of Lyon'],
  'Tuscany': ['Piedmont', 'Venice', 'Rome', 'Gulf of Lyon', 'Tyrrhenian Sea'],
  'Venice': ['Piedmont', 'Tyrolia', 'Trieste', 'Tuscany', 'Rome', 'Apulia', 'Adriatic Sea'],
  'Rome': ['Tuscany', 'Venice', 'Apulia', 'Naples', 'Tyrrhenian Sea'],
  'Apulia': ['Venice', 'Rome', 'Naples', 'Adriatic Sea', 'Ionian Sea'],
  'Naples': ['Rome', 'Apulia', 'Tyrrhenian Sea', 'Ionian Sea'],

  // Central Europe
  'Tyrolia': ['Munich', 'Bohemia', 'Vienna', 'Trieste', 'Venice', 'Piedmont'],
  'Bohemia': ['Munich', 'Silesia', 'Galicia', 'Vienna', 'Tyrolia'],
  'Vienna': ['Tyrolia', 'Bohemia', 'Galicia', 'Budapest', 'Trieste'],
  'Trieste': ['Venice', 'Tyrolia', 'Vienna', 'Budapest', 'Serbia', 'Albania', 'Adriatic Sea'],
  'Budapest': ['Vienna', 'Galicia', 'Rumania', 'Serbia', 'Trieste'],
  'Galicia': ['Silesia', 'Warsaw', 'Ukraine', 'Rumania', 'Budapest', 'Vienna', 'Bohemia'],

  // Balkans
  'Serbia': ['Trieste', 'Budapest', 'Rumania', 'Bulgaria', 'Greece', 'Albania'],
  'Albania': ['Trieste', 'Serbia', 'Greece', 'Adriatic Sea', 'Ionian Sea'],
  'Greece': ['Serbia', 'Bulgaria', 'Albania', 'Aegean Sea', 'Ionian Sea'],
  'Bulgaria': ['Serbia', 'Rumania', 'Constantinople', 'Greece', 'Black Sea', 'Aegean Sea'],
  'Rumania': ['Budapest', 'Galicia', 'Ukraine', 'Sevastopol', 'Bulgaria', 'Black Sea'],

  // Russia
  'St Petersburg': ['Norway', 'Finland', 'Livonia', 'Moscow', 'Barents Sea', 'Gulf of Bothnia'],
  'Livonia': ['St Petersburg', 'Moscow', 'Warsaw', 'Prussia', 'Baltic Sea', 'Gulf of Bothnia'],
  'Moscow': ['St Petersburg', 'Livonia', 'Warsaw', 'Ukraine', 'Sevastopol'],
  'Warsaw': ['Livonia', 'Prussia', 'Silesia', 'Galicia', 'Ukraine', 'Moscow'],
  'Ukraine': ['Moscow', 'Warsaw', 'Galicia', 'Rumania', 'Sevastopol'],
  'Sevastopol': ['Moscow', 'Ukraine', 'Rumania', 'Armenia', 'Black Sea'],

  // Turkey
  'Constantinople': ['Bulgaria', 'Ankara', 'Smyrna', 'Black Sea', 'Aegean Sea'],
  'Ankara': ['Constantinople', 'Smyrna', 'Armenia', 'Black Sea'],
  'Smyrna': ['Constantinople', 'Ankara', 'Armenia', 'Syria', 'Aegean Sea', 'Eastern Mediterranean'],
  'Armenia': ['Sevastopol', 'Ankara', 'Smyrna', 'Syria', 'Black Sea'],
  'Syria': ['Smyrna', 'Armenia', 'Eastern Mediterranean'],

  // North Africa
  'Tunis': ['Tyrrhenian Sea', 'Ionian Sea', 'Western Med'],
  'North Africa': ['Mid-Atlantic Ocean', 'Western Med'],

  // Seas
  'North Sea': ['Norway', 'Denmark', 'Holland', 'Belgium', 'English Channel', 'London', 'Yorkshire', 'Edinburgh', 'Norwegian Sea', 'Helgoland Bight', 'Skagerrak'],
  'English Channel': ['Wales', 'London', 'North Sea', 'Belgium', 'Picardy', 'Brest', 'Mid-Atlantic Ocean', 'Irish Sea'],
  'Irish Sea': ['Liverpool', 'Wales', 'English Channel', 'North Atlantic Ocean'],
  'Mid-Atlantic Ocean': ['Irish Sea', 'English Channel', 'Brest', 'Gascony', 'Spain', 'Portugal', 'North Africa', 'Western Med', 'North Atlantic Ocean'],
  'North Atlantic Ocean': ['Clyde', 'Liverpool', 'Irish Sea', 'Mid-Atlantic Ocean', 'Norwegian Sea'],
  'Norwegian Sea': ['North Atlantic Ocean', 'Clyde', 'Edinburgh', 'North Sea', 'Norway', 'Barents Sea'],
  'Barents Sea': ['Norwegian Sea', 'Norway', 'St Petersburg'],
  'Baltic Sea': ['Denmark', 'Kiel', 'Berlin', 'Prussia', 'Livonia', 'Gulf of Bothnia', 'Sweden'],
  'Gulf of Bothnia': ['Sweden', 'Finland', 'St Petersburg', 'Livonia', 'Baltic Sea'],
  'Skagerrak': ['Norway', 'Sweden', 'Denmark', 'North Sea'],
  'Helgoland Bight': ['Holland', 'Kiel', 'Denmark', 'North Sea'],
  'Adriatic Sea': ['Venice', 'Apulia', 'Ionian Sea', 'Albania', 'Trieste'],
  'Aegean Sea': ['Greece', 'Bulgaria', 'Constantinople', 'Smyrna', 'Ionian Sea', 'Eastern Mediterranean'],
  'Black Sea': ['Bulgaria', 'Rumania', 'Sevastopol', 'Armenia', 'Ankara', 'Constantinople'],
  'Ionian Sea': ['Naples', 'Apulia', 'Adriatic Sea', 'Albania', 'Greece', 'Aegean Sea', 'Eastern Mediterranean', 'Tyrrhenian Sea', 'Tunis'],
  'Tyrrhenian Sea': ['Tuscany', 'Rome', 'Naples', 'Ionian Sea', 'Tunis', 'Western Med', 'Gulf of Lyon'],
  'Western Med': ['Spain', 'Gulf of Lyon', 'Tyrrhenian Sea', 'Tunis', 'North Africa', 'Mid-Atlantic Ocean'],
  'Gulf of Lyon': ['Spain', 'Marseilles', 'Piedmont', 'Tuscany', 'Tyrrhenian Sea', 'Western Med'],
  'Eastern Mediterranean': ['Aegean Sea', 'Smyrna', 'Syria', 'Ionian Sea'],
};

// Starting units for 1901
const startingUnits: Record<string, Unit[]> = {
  'England': [
    { type: 'F', location: 'Edinburgh' },
    { type: 'F', location: 'London' },
    { type: 'A', location: 'Liverpool' }
  ],
  'France': [
    { type: 'F', location: 'Brest' },
    { type: 'A', location: 'Paris' },
    { type: 'A', location: 'Marseilles' }
  ],
  'Germany': [
    { type: 'F', location: 'Kiel' },
    { type: 'A', location: 'Berlin' },
    { type: 'A', location: 'Munich' }
  ],
  'Italy': [
    { type: 'F', location: 'Naples' },
    { type: 'A', location: 'Rome' },
    { type: 'A', location: 'Venice' }
  ],
  'Austria-Hungary': [
    { type: 'F', location: 'Trieste' },
    { type: 'A', location: 'Vienna' },
    { type: 'A', location: 'Budapest' }
  ],
  'Russia': [
    { type: 'F', location: 'St Petersburg', coast: 'sc' },
    { type: 'A', location: 'Moscow' },
    { type: 'A', location: 'Warsaw' },
    { type: 'F', location: 'Sevastopol' }
  ],
  'Turkey': [
    { type: 'A', location: 'Constantinople' },
    { type: 'A', location: 'Smyrna' },
    { type: 'F', location: 'Ankara' }
  ]
};

// Country colors
const countryColors: Record<string, string> = {
  'England': '#1E40AF',      // Blue
  'France': '#60A5FA',       // Light Blue
  'Germany': '#6B7280',      // Gray
  'Italy': '#16A34A',        // Green
  'Austria-Hungary': '#DC2626', // Red
  'Russia': '#E5E7EB',       // White/Light Gray
  'Turkey': '#EAB308'        // Yellow
};

function drawMap(outputPath: string): void {
  const canvas = createCanvas(1600, 900);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#F3F4F6';
  ctx.fillRect(0, 0, 1600, 900);

  // Draw borders between adjacent territories
  ctx.strokeStyle = '#9CA3AF';
  ctx.lineWidth = 1.5;

  const drawnBorders = new Set<string>();
  for (const [territory1, neighbors] of Object.entries(adjacencies)) {
    const t1 = territories[territory1];
    if (!t1) continue;

    for (const territory2 of neighbors) {
      const t2 = territories[territory2];
      if (!t2) continue;

      // Create a unique key for this border (sorted to avoid duplicates)
      const borderKey = [territory1, territory2].sort().join('|');
      if (drawnBorders.has(borderKey)) continue;
      drawnBorders.add(borderKey);

      // Draw border line
      ctx.beginPath();
      ctx.moveTo(t1.x, t1.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.stroke();
    }
  }

  // Draw water territories with light blue
  ctx.fillStyle = '#BFDBFE';
  for (const [name, territory] of Object.entries(territories)) {
    if (territory.isWater) {
      ctx.beginPath();
      ctx.arc(territory.x, territory.y, 30, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw land borders (simplified - just circles for territories)
  for (const [name, territory] of Object.entries(territories)) {
    if (territory.isWater) continue;

    // Territory background color based on owner
    if (territory.owner) {
      ctx.fillStyle = countryColors[territory.owner] + '40'; // Add transparency
    } else {
      ctx.fillStyle = '#D1D5DB'; // Gray for neutral
    }

    ctx.beginPath();
    ctx.arc(territory.x, territory.y, 25, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Supply center marker
    if (territory.isSupplyCenter) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(territory.x, territory.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw units
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const [country, units] of Object.entries(startingUnits)) {
    ctx.fillStyle = countryColors[country];

    for (const unit of units) {
      const territory = territories[unit.location];
      if (territory) {
        // Draw unit symbol (A or F)
        ctx.fillText(unit.type, territory.x, territory.y - 8);
      }
    }
  }

  // Draw territory labels
  ctx.font = '10px Arial';
  ctx.fillStyle = '#000000';

  for (const [name, territory] of Object.entries(territories)) {
    if (!territory.isWater) {
      ctx.fillText(territory.name, territory.x, territory.y + 18);
    }
  }

  // Draw water labels
  ctx.font = 'italic 11px Arial';
  ctx.fillStyle = '#1E40AF'; // Dark blue for water names
  ctx.textAlign = 'center';

  for (const [name, territory] of Object.entries(territories)) {
    if (territory.isWater) {
      ctx.fillText(territory.name, territory.x, territory.y);
    }
  }

  // Reset text alignment
  ctx.textAlign = 'center';

  // Draw title
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.fillText('Diplomacy', 20, 30);

  // Draw legend
  ctx.font = '14px Arial';
  let legendY = 60;
  for (const [country, color] of Object.entries(countryColors)) {
    ctx.fillStyle = color;
    ctx.fillRect(20, legendY, 20, 20);
    ctx.fillStyle = '#000000';
    ctx.fillText(country, 50, legendY + 10);
    legendY += 30;
  }

  // Add notation
  ctx.font = '12px Arial';
  ctx.fillText('A = Army, F = Fleet', 20, legendY + 20);
  ctx.fillText('● = Supply Center', 20, legendY + 40);

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Map saved to: ${outputPath}`);
}

function drawMapWithUnits(outputPath: string, customUnits?: Record<string, { type: 'A' | 'F'; location: string; coast?: string }[]>, seasonTitle?: string, supplyCenterOwnership?: Record<string, string>): void {
  const canvas = createCanvas(1600, 900);
  const ctx = canvas.getContext('2d');

  const unitsToUse = customUnits || startingUnits;

  // Update territory ownership based on supply center ownership if provided
  if (supplyCenterOwnership) {
    for (const [scName, owner] of Object.entries(supplyCenterOwnership)) {
      if (territories[scName] && territories[scName].isSupplyCenter) {
        territories[scName].owner = owner;
      }
    }
  }

  // Background
  ctx.fillStyle = '#F3F4F6';
  ctx.fillRect(0, 0, 1600, 900);

  // Draw borders between adjacent territories
  ctx.strokeStyle = '#9CA3AF';
  ctx.lineWidth = 1.5;

  const drawnBorders = new Set<string>();
  for (const [territory1, neighbors] of Object.entries(adjacencies)) {
    const t1 = territories[territory1];
    if (!t1) continue;

    for (const territory2 of neighbors) {
      const t2 = territories[territory2];
      if (!t2) continue;

      // Create a unique key for this border (sorted to avoid duplicates)
      const borderKey = [territory1, territory2].sort().join('|');
      if (drawnBorders.has(borderKey)) continue;
      drawnBorders.add(borderKey);

      // Draw border line
      ctx.beginPath();
      ctx.moveTo(t1.x, t1.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.stroke();
    }
  }

  // Draw water territories with light blue
  ctx.fillStyle = '#BFDBFE';
  for (const [name, territory] of Object.entries(territories)) {
    if (territory.isWater) {
      ctx.beginPath();
      ctx.arc(territory.x, territory.y, 30, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw land borders (simplified - just circles for territories)
  for (const [name, territory] of Object.entries(territories)) {
    if (territory.isWater) continue;

    // Territory background color based on owner
    if (territory.owner) {
      ctx.fillStyle = countryColors[territory.owner] + '40'; // Add transparency
    } else {
      ctx.fillStyle = '#D1D5DB'; // Gray for neutral
    }

    ctx.beginPath();
    ctx.arc(territory.x, territory.y, 25, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Supply center marker
    if (territory.isSupplyCenter) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(territory.x, territory.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw units
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const [country, units] of Object.entries(unitsToUse)) {
    ctx.fillStyle = countryColors[country];

    for (const unit of units) {
      const territory = territories[unit.location];
      if (territory) {
        // Draw unit symbol (A or F)
        ctx.fillText(unit.type, territory.x, territory.y - 8);
      }
    }
  }

  // Draw territory labels
  ctx.font = '10px Arial';
  ctx.fillStyle = '#000000';

  for (const [name, territory] of Object.entries(territories)) {
    if (!territory.isWater) {
      ctx.fillText(territory.name, territory.x, territory.y + 18);
    }
  }

  // Draw water labels
  ctx.font = 'italic 11px Arial';
  ctx.fillStyle = '#1E40AF'; // Dark blue for water names
  ctx.textAlign = 'center';

  for (const [name, territory] of Object.entries(territories)) {
    if (territory.isWater) {
      ctx.fillText(territory.name, territory.x, territory.y);
    }
  }

  // Reset text alignment
  ctx.textAlign = 'center';

  // Draw title
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  const title = seasonTitle || 'Diplomacy';
  ctx.fillText(title, 20, 30);

  // Draw legend
  ctx.font = '14px Arial';
  let legendY = 60;
  for (const [country, color] of Object.entries(countryColors)) {
    ctx.fillStyle = color;
    ctx.fillRect(20, legendY, 20, 20);
    ctx.fillStyle = '#000000';
    ctx.fillText(country, 50, legendY + 10);
    legendY += 30;
  }

  // Add notation
  ctx.font = '12px Arial';
  ctx.fillText('A = Army, F = Fleet', 20, legendY + 20);
  ctx.fillText('● = Supply Center', 20, legendY + 40);

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Map saved to: ${outputPath}`);
}

// Run if called directly
if (require.main === module) {
  const outputPath = path.join(process.cwd(), 'diplomacy-map-1901.png');
  drawMap(outputPath);
}

export { drawMap, drawMapWithUnits, territories, startingUnits, countryColors };
