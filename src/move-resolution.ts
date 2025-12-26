import * as fs from 'fs';
import * as path from 'path';

export interface Unit {
  type: 'A' | 'F';
  location: string;
  coast?: string;
}

export interface Move {
  country: string;
  unit: Unit;
  from: string;
  to?: string;
  action: 'hold' | 'move' | 'support' | 'convoy';
  supportTarget?: { from: string; to: string };
  convoyTarget?: { from: string; to: string };
  valid: boolean;
  invalidReason?: string;
}

export interface MoveResult {
  country: string;
  unit: Unit;
  from: string;
  to?: string;
  action: string;
  success: boolean;
  dislodged: boolean;
  strength?: number;
  bouncedWith?: string[];
  reason?: string;
}

export interface DislodgedUnit {
  country: string;
  unit: Unit;
  from: string;
}

export interface RetreatOrder {
  country: string;
  unit: Unit;
  from: string;
  to?: string; // undefined means disband
}

export interface RetreatResult {
  country: string;
  unit: Unit;
  from: string;
  to?: string;
  success: boolean;
  disbanded: boolean;
  reason?: string;
}

export interface BuildOrder {
  country: string;
  type: 'A' | 'F';
  location: string;
  coast?: string;
}

export interface DisbandOrder {
  country: string;
  unit: Unit;
  location: string;
}

export interface BuildDisbandResult {
  country: string;
  type?: 'A' | 'F';
  location: string;
  action: 'build' | 'disband';
  success: boolean;
  reason?: string;
}

// Complete adjacency data for standard Diplomacy board
export const adjacencies: Record<string, string[]> = {
  // British Isles
  'Clyde': ['Edinburgh', 'Liverpool', 'North Atlantic Ocean', 'Norwegian Sea'],
  'Edinburgh': ['Clyde', 'Liverpool', 'Yorkshire', 'North Sea', 'Norwegian Sea'],
  'Liverpool': ['Clyde', 'Edinburgh', 'Yorkshire', 'Wales', 'Irish Sea', 'North Atlantic Ocean'],
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

// Water spaces (seas and oceans) - armies cannot enter these
export const waterSpaces = new Set([
  'North Sea', 'English Channel', 'Irish Sea', 'Mid-Atlantic Ocean', 'North Atlantic Ocean',
  'Norwegian Sea', 'Barents Sea', 'Baltic Sea', 'Gulf of Bothnia', 'Skagerrak', 'Helgoland Bight',
  'Adriatic Sea', 'Aegean Sea', 'Black Sea', 'Ionian Sea', 'Tyrrhenian Sea',
  'Western Med', 'Gulf of Lyon', 'Eastern Mediterranean'
]);

export function parseMove(moveText: string, country: string, startingUnits: Unit[]): Move | null {
  const text = moveText.trim().toLowerCase();

  // Try to parse different move formats
  // "A Rome to Apulia"
  // "F Naples to Ionian Sea"
  // "F Brest to Mid-Atlantic Ocean"
  // "A Vienna HOLD"
  // "A Vienna supports A Budapest to Serbia"
  // "F North Sea Convoys A London to Belgium"

  // Check convoy first (most specific pattern)
  const convoyMatch = text.match(/([af])\s+([a-z\s-]+?)\s+convoys?\s+([af])\s+([a-z\s-]+)\s+to\s+([a-z\s-]+)/i);

  // Check support for hold (defensive support): "A Munich supports A Berlin HOLD" or "A Munich supports Berlin HOLD"
  const supportHoldMatch = text.match(/([af])\s+([a-z\s-]+?)\s+supports?\s+(?:[af]\s+)?([a-z\s-]+)\s+hold/i);

  // Check support for move (offensive support): "A Munich supports A Berlin to Ruhr" or "A Munich supports Berlin to Ruhr"
  const supportMatch = text.match(/([af])\s+([a-z\s-]+?)\s+supports?\s+(?:[af]\s+)?([a-z\s-]+)\s+to\s+([a-z\s-]+)/i);

  // Check hold
  const holdMatch = text.match(/([af])\s+([a-z\s-]+?)\s+hold/i);

  // Check basic move (least specific, so last)
  const moveMatch = text.match(/^([af])\s+([a-z\s-]+?)\s+to\s+([a-z\s-]+)$/i);

  // Process matches in order of specificity (most specific first)

  if (convoyMatch) {
    const unitType = convoyMatch[1].toUpperCase() as 'A' | 'F';
    const from = normalizeLocation(convoyMatch[2]);
    const convoyedUnitType = convoyMatch[3].toUpperCase() as 'A' | 'F';
    const convoyedFrom = normalizeLocation(convoyMatch[4]);
    const convoyedTo = normalizeLocation(convoyMatch[5]);

    const unit = startingUnits.find(u => u.type === unitType && normalizeLocation(u.location) === from);

    if (!unit) {
      return {
        country,
        unit: { type: unitType, location: from },
        from,
        action: 'convoy',
        valid: false,
        invalidReason: `No ${unitType} unit found in ${from}`
      };
    }

    // Validate convoy: fleet must be in water, convoying an army
    if (unitType !== 'F') {
      return {
        country,
        unit,
        from,
        action: 'convoy',
        convoyTarget: { from: convoyedFrom, to: convoyedTo },
        valid: false,
        invalidReason: 'Only fleets can convoy'
      };
    }

    if (convoyedUnitType !== 'A') {
      return {
        country,
        unit,
        from,
        action: 'convoy',
        convoyTarget: { from: convoyedFrom, to: convoyedTo },
        valid: false,
        invalidReason: 'Only armies can be convoyed'
      };
    }

    if (!waterSpaces.has(from)) {
      return {
        country,
        unit,
        from,
        action: 'convoy',
        convoyTarget: { from: convoyedFrom, to: convoyedTo },
        valid: false,
        invalidReason: `${from} is not a water space`
      };
    }

    // Validate that the fleet is adjacent to both the army's start and destination
    const fleetAdjacent = adjacencies[from] || [];
    const canReachStart = fleetAdjacent.includes(convoyedFrom);
    const canReachDestination = fleetAdjacent.includes(convoyedTo);

    if (!canReachStart || !canReachDestination) {
      return {
        country,
        unit,
        from,
        action: 'convoy',
        convoyTarget: { from: convoyedFrom, to: convoyedTo },
        valid: false,
        invalidReason: `${from} cannot convoy from ${convoyedFrom} to ${convoyedTo} (not adjacent to both)`
      };
    }

    return {
      country,
      unit,
      from,
      action: 'convoy',
      convoyTarget: { from: convoyedFrom, to: convoyedTo },
      valid: true
    };
  }

  if (supportHoldMatch) {
    const unitType = supportHoldMatch[1].toUpperCase() as 'A' | 'F';
    const from = normalizeLocation(supportHoldMatch[2]);
    const supportFrom = normalizeLocation(supportHoldMatch[3]);

    const unit = startingUnits.find(u => u.type === unitType && normalizeLocation(u.location) === from);

    if (!unit) {
      return {
        country,
        unit: { type: unitType, location: from },
        from,
        action: 'support',
        supportTarget: { from: supportFrom, to: supportFrom }, // For hold, to = from
        valid: false,
        invalidReason: `No ${unitType} unit found in ${from}`
      };
    }

    // VALIDATION: Supporting unit must be able to legally move to the province it's supporting
    const supportingUnitAdjacent = adjacencies[from] || [];
    const canReachSupportTarget = supportingUnitAdjacent.includes(supportFrom);

    // Additional check: if supporting unit is Army, destination cannot be water-only
    const isWaterOnlyDestination = waterSpaces.has(supportFrom) &&
                                    !supportingUnitAdjacent.some(adj => !waterSpaces.has(adj));

    if (!canReachSupportTarget) {
      return {
        country,
        unit,
        from,
        action: 'support',
        supportTarget: { from: supportFrom, to: supportFrom },
        valid: false,
        invalidReason: `${from} is not adjacent to ${supportFrom} - cannot provide support`
      };
    }

    if (unitType === 'A' && waterSpaces.has(supportFrom)) {
      return {
        country,
        unit,
        from,
        action: 'support',
        supportTarget: { from: supportFrom, to: supportFrom },
        valid: false,
        invalidReason: `Armies cannot support into water spaces (${supportFrom})`
      };
    }

    if (unitType === 'F' && !waterSpaces.has(from) && !waterSpaces.has(supportFrom)) {
      return {
        country,
        unit,
        from,
        action: 'support',
        supportTarget: { from: supportFrom, to: supportFrom },
        valid: false,
        invalidReason: `Fleets on land cannot support other land provinces`
      };
    }

    return {
      country,
      unit,
      from,
      action: 'support',
      supportTarget: { from: supportFrom, to: supportFrom }, // For hold, to = from
      valid: true
    };
  }

  if (supportMatch) {
    const unitType = supportMatch[1].toUpperCase() as 'A' | 'F';
    const from = normalizeLocation(supportMatch[2]);
    const supportFrom = normalizeLocation(supportMatch[3]);
    const supportTo = normalizeLocation(supportMatch[4]);

    const unit = startingUnits.find(u => u.type === unitType && normalizeLocation(u.location) === from);

    if (!unit) {
      return {
        country,
        unit: { type: unitType, location: from },
        from,
        action: 'support',
        supportTarget: { from: supportFrom, to: supportTo },
        valid: false,
        invalidReason: `No ${unitType} unit found in ${from}`
      };
    }

    // VALIDATION: Supporting unit must be able to legally move to the DESTINATION province
    const supportingUnitAdjacent = adjacencies[from] || [];
    const canReachDestination = supportingUnitAdjacent.includes(supportTo);

    if (!canReachDestination) {
      return {
        country,
        unit,
        from,
        action: 'support',
        supportTarget: { from: supportFrom, to: supportTo },
        valid: false,
        invalidReason: `${from} is not adjacent to ${supportTo} - cannot support move to that destination`
      };
    }

    // Armies cannot support moves into water-only spaces
    if (unitType === 'A' && waterSpaces.has(supportTo)) {
      return {
        country,
        unit,
        from,
        action: 'support',
        supportTarget: { from: supportFrom, to: supportTo },
        valid: false,
        invalidReason: `Armies cannot support moves into water spaces (${supportTo})`
      };
    }

    // Fleets on land cannot support moves to other land provinces
    if (unitType === 'F' && !waterSpaces.has(from) && !waterSpaces.has(supportTo)) {
      return {
        country,
        unit,
        from,
        action: 'support',
        supportTarget: { from: supportFrom, to: supportTo },
        valid: false,
        invalidReason: `Fleets on land cannot support moves to other land provinces`
      };
    }

    return {
      country,
      unit,
      from,
      action: 'support',
      supportTarget: { from: supportFrom, to: supportTo },
      valid: true
    };
  }

  if (holdMatch) {
    const unitType = holdMatch[1].toUpperCase() as 'A' | 'F';
    const from = normalizeLocation(holdMatch[2]);

    const unit = startingUnits.find(u => u.type === unitType && normalizeLocation(u.location) === from);

    if (!unit) {
      return {
        country,
        unit: { type: unitType, location: from },
        from,
        action: 'hold',
        valid: false,
        invalidReason: `No ${unitType} unit found in ${from}`
      };
    }

    return {
      country,
      unit,
      from,
      action: 'hold',
      valid: true
    };
  }

  if (moveMatch) {
    const unitType = moveMatch[1].toUpperCase() as 'A' | 'F';
    const from = normalizeLocation(moveMatch[2]);
    const to = normalizeLocation(moveMatch[3]);

    const unit = startingUnits.find(u => u.type === unitType && normalizeLocation(u.location) === from);

    if (!unit) {
      return {
        country,
        unit: { type: unitType, location: from },
        from,
        to,
        action: 'move',
        valid: false,
        invalidReason: `No ${unitType} unit found in ${from}`
      };
    }

    // Check adjacency for fleets (fleets cannot be convoyed)
    const adjacent = adjacencies[from];
    if (unitType === 'F' && (!adjacent || !adjacent.includes(to))) {
      return {
        country,
        unit,
        from,
        to,
        action: 'move',
        valid: false,
        invalidReason: `${from} is not adjacent to ${to}`
      };
    }

    // For armies, allow non-adjacent moves (they may be convoyed)
    // Convoy validation happens during resolution

    // Check if army is trying to move into water (without convoy)
    if (unitType === 'A' && waterSpaces.has(to)) {
      return {
        country,
        unit,
        from,
        to,
        action: 'move',
        valid: false,
        invalidReason: `Armies cannot enter water spaces (${to})`
      };
    }

    // NOTE: We do NOT check if destination is occupied here!
    // In Diplomacy, all moves are simultaneous, so a space being occupied
    // doesn't make a move illegal - it just affects resolution.
    // Occupation is checked during resolution to see if the move succeeds.

    return {
      country,
      unit,
      from,
      to,
      action: 'move',
      valid: true
    };
  }

  return null;
}

function normalizeLocation(loc: string): string {
  // Small words that should be lowercase in title case (unless first word)
  const smallWords = new Set(['of', 'the', 'and', 'or']);

  const normalized = loc.trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word, index) => {
      const lower = word.toLowerCase();
      // Keep small words lowercase unless it's the first word
      if (index > 0 && smallWords.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  // Handle special cases and common variations
  const replacements: Record<string, string> = {
    // St Petersburg variations
    'St Petersburg': 'St Petersburg',
    'St. Petersburg': 'St Petersburg',
    'Saint Petersburg': 'St Petersburg',
    'Stp': 'St Petersburg',

    // Sea/Ocean variations
    'Mid Atlantic Ocean': 'Mid-Atlantic Ocean',
    'Midatlantic Ocean': 'Mid-Atlantic Ocean',
    'Mid-atlantic Ocean': 'Mid-Atlantic Ocean',
    'Mao': 'Mid-Atlantic Ocean',

    'North Atlantic Ocean': 'North Atlantic Ocean',
    'Nao': 'North Atlantic Ocean',
    'Nth Atlantic Ocean': 'North Atlantic Ocean',

    'English Channel': 'English Channel',
    'Eng': 'English Channel',
    'Ech': 'English Channel',

    'North Sea': 'North Sea',
    'Nth Sea': 'North Sea',
    'Nts': 'North Sea',

    'Norwegian Sea': 'Norwegian Sea',
    'Nwg': 'Norwegian Sea',
    'Nrg': 'Norwegian Sea',

    'Barents Sea': 'Barents Sea',
    'Bar': 'Barents Sea',

    'Baltic Sea': 'Baltic Sea',
    'Bal': 'Baltic Sea',

    'Gulf of Bothnia': 'Gulf of Bothnia',
    'Gob': 'Gulf of Bothnia',
    'Bot': 'Gulf of Bothnia',

    'Gulf of Lyon': 'Gulf of Lyon',
    'Gol': 'Gulf of Lyon',
    'Lyo': 'Gulf of Lyon',
    'Lyon': 'Gulf of Lyon',

    'Black Sea': 'Black Sea',
    'Bla': 'Black Sea',

    'Aegean Sea': 'Aegean Sea',
    'Aeg': 'Aegean Sea',

    'Adriatic Sea': 'Adriatic Sea',
    'Adr': 'Adriatic Sea',

    'Ionian Sea': 'Ionian Sea',
    'Ion': 'Ionian Sea',

    'Tyrrhenian Sea': 'Tyrrhenian Sea',
    'Tyn': 'Tyrrhenian Sea',
    'Tys': 'Tyrrhenian Sea',

    'Eastern Mediterranean': 'Eastern Mediterranean',
    'Eas': 'Eastern Mediterranean',
    'Emed': 'Eastern Mediterranean',
    'Eastern Med': 'Eastern Mediterranean',

    'Western Med': 'Western Med',
    'Wes': 'Western Med',
    'Wmed': 'Western Med',
    'Western Mediterranean': 'Western Med',

    // Territory variations
    'Austria-hungary': 'Austria-Hungary',
    'Austria Hungary': 'Austria-Hungary',

    'North Africa': 'North Africa',
    'Naf': 'North Africa',
  };

  return replacements[normalized] || normalized;
}

export function resolveSpring1901(
  moves: Move[],
  allUnitPositions?: Record<string, { type: 'A' | 'F'; location: string }[]>
): MoveResult[] {
  const results: MoveResult[] = [];
  const movesByDestination: Record<string, Move[]> = {};
  const movesBySource: Record<string, Move> = {};

  // Add default HOLD orders for units that have no orders
  // This ensures all units defend their positions
  if (allUnitPositions) {
    const unitsWithOrders = new Set<string>();
    for (const move of moves) {
      unitsWithOrders.add(`${move.country}:${move.unit.type}:${move.from}`);
    }

    for (const [country, units] of Object.entries(allUnitPositions)) {
      for (const unit of units) {
        const unitKey = `${country}:${unit.type}:${unit.location}`;
        if (!unitsWithOrders.has(unitKey)) {
          // Add a default HOLD order
          moves.push({
            country,
            unit,
            from: unit.location,
            action: 'hold',
            valid: true
          });
        }
      }
    }
  }

  // Track convoy orders
  const convoyOrders: Map<string, Move[]> = new Map(); // Key: "armyFrom->armyTo", Value: convoying fleets

  for (const move of moves) {
    if (move.action === 'convoy' && move.valid && move.convoyTarget) {
      const key = `${move.convoyTarget.from}->${move.convoyTarget.to}`;
      if (!convoyOrders.has(key)) {
        convoyOrders.set(key, []);
      }
      convoyOrders.get(key)!.push(move);
    }
  }

  // CRITICAL FIX: Validate army moves to non-adjacent territories BEFORE grouping
  // This prevents invalid convoy moves from participating in bounce calculations
  for (const move of moves) {
    if (move.action === 'move' && move.to && move.valid && move.unit.type === 'A') {
      const adjacent = adjacencies[move.from] || [];
      const isAdjacent = adjacent.includes(move.to);

      if (!isAdjacent) {
        // Army is moving to non-adjacent location - requires convoy
        const convoyKey = `${move.from}->${move.to}`;
        const convoys = convoyOrders.get(convoyKey) || [];

        if (convoys.length === 0) {
          // No convoy available - mark move as INVALID
          move.valid = false;
          move.invalidReason = `No convoy available from ${move.from} to ${move.to}`;
        }
      }
    }
  }

  // Group moves by destination and source
  for (const move of moves) {
    if (move.action === 'move' && move.to && move.valid) {
      if (!movesByDestination[move.to]) {
        movesByDestination[move.to] = [];
      }
      movesByDestination[move.to].push(move);
      movesBySource[move.from] = move;
    } else if (move.action === 'hold' && move.valid) {
      movesBySource[move.from] = move;
    } else if (move.action === 'support' && move.valid) {
      // Supporting units occupy and defend their position
      movesBySource[move.from] = move;
    } else if (move.action === 'convoy' && move.valid) {
      // Convoying fleets hold their position
      movesBySource[move.from] = move;
    } else if (!move.valid) {
      // INVALID ORDERS: Units with invalid orders default to HOLD
      // This ensures they still defend their position
      if (!movesBySource[move.from]) {
        movesBySource[move.from] = {
          ...move,
          action: 'hold',
          valid: true // Treat as valid HOLD
        };
      }
    }
  }

  // Calculate strengths for both attacks (moves) and defense (holds)
  const strengths: Record<string, number> = {};
  const holdStrengths: Record<string, number> = {};

  // Calculate attack strengths
  for (const move of moves) {
    if (move.action === 'move' && move.to && move.valid) {
      const key = `${move.from}->${move.to}`;
      let strength = 1;

      // Add supports for this attack
      for (const supportMove of moves) {
        if (supportMove.action === 'support' && supportMove.valid && supportMove.supportTarget) {
          if (supportMove.supportTarget.from === move.from &&
              supportMove.supportTarget.to === move.to) {
            // Check if support is cut (any attack on the supporting unit from a province other than the one being supported)
            const supportTarget = supportMove.supportTarget; // Capture for closure
            const supportCut = moves.some(m =>
              m.action === 'move' &&
              m.to === supportMove.from &&
              m.country !== supportMove.country &&
              m.from !== supportTarget.to && // Support is NOT cut by attack from the province being supported
              m.valid
            );

            if (!supportCut) {
              strength++;
            }
          }
        }
      }

      strengths[key] = strength;
    }
  }

  // Calculate defensive strengths for holds AND supports
  // (units giving support also defend their position with strength 1)
  for (const move of moves) {
    if (move.action === 'hold' && move.valid) {
      let strength = 1;

      // Add defensive supports (support to hold)
      for (const supportMove of moves) {
        if (supportMove.action === 'support' && supportMove.valid && supportMove.supportTarget) {
          // Support for hold: from = to (e.g., "A Munich supports A Berlin to Berlin" or "A Munich supports A Berlin HOLD")
          if (supportMove.supportTarget.from === move.from &&
              (supportMove.supportTarget.to === move.from || !supportMove.supportTarget.to)) {
            // Check if support is cut
            const supportCut = moves.some(m =>
              m.action === 'move' &&
              m.to === supportMove.from &&
              m.country !== supportMove.country &&
              m.valid
            );

            if (!supportCut) {
              strength++;
            }
          }
        }
      }

      holdStrengths[move.from] = strength;
    } else if (move.action === 'support' && move.valid) {
      // Supporting units also defend their position with strength 1
      // (they cannot receive defensive support while giving offensive support)
      holdStrengths[move.from] = 1;
    } else if (move.action === 'convoy' && move.valid) {
      // Convoying fleets also defend their position with strength 1
      // (like supporting units, they cannot receive defensive support while convoying)
      holdStrengths[move.from] = 1;
    }
  }

  // Resolve moves
  for (const move of moves) {
    if (!move.valid) {
      // Invalid moves mean the unit stays in place - check for dislodgement
      const defenseStrength = holdStrengths[move.from] || 1;

      // Check if being attacked
      const attackers = moves.filter(m =>
        m.action === 'move' &&
        m.to === move.from &&
        m.country !== move.country &&
        m.valid
      );

      let isDislodged = false;
      if (attackers.length > 0) {
        // Find strongest attacker
        let maxStrength = 0;
        for (const attacker of attackers) {
          const key = `${attacker.from}->${attacker.to}`;
          const strength = strengths[key] || 1;
          if (strength > maxStrength) {
            maxStrength = strength;
          }
        }

        // Unit is dislodged if attacker's strength > defender's strength
        isDislodged = maxStrength > defenseStrength;
      }

      results.push({
        country: move.country,
        unit: move.unit,
        from: move.from,
        to: move.to,
        action: move.action,
        success: false,
        dislodged: isDislodged,
        reason: isDislodged ? `${move.invalidReason} - Unit dislodged by attack` : move.invalidReason
      });
      continue;
    }

    if (move.action === 'hold') {
      // Get defensive strength (includes supports)
      const defenseStrength = holdStrengths[move.from] || 1;

      // Check if dislodged
      const attackers = moves.filter(m =>
        m.action === 'move' &&
        m.to === move.from &&
        m.country !== move.country &&
        m.valid
      );

      if (attackers.length > 0) {
        // Find strongest attacker
        let maxStrength = 0;
        for (const attacker of attackers) {
          const key = `${attacker.from}->${attacker.to}`;
          const strength = strengths[key] || 1;
          if (strength > maxStrength) {
            maxStrength = strength;
          }
        }

        // Defender is dislodged only if attacker's strength > defender's strength
        const isDislodged = maxStrength > defenseStrength;

        results.push({
          country: move.country,
          unit: move.unit,
          from: move.from,
          action: 'hold',
          success: true,
          dislodged: isDislodged,
          strength: defenseStrength,
          reason: isDislodged ? `Dislodged by attack (strength ${maxStrength} vs ${defenseStrength})` : `Held successfully (strength ${defenseStrength} vs ${maxStrength})`
        });
      } else {
        results.push({
          country: move.country,
          unit: move.unit,
          from: move.from,
          action: 'hold',
          success: true,
          dislodged: false,
          strength: defenseStrength
        });
      }
      continue;
    }

    if (move.action === 'move' && move.to) {
      // Check if this is an army move requiring a convoy
      if (move.unit.type === 'A') {
        const adjacent = adjacencies[move.from] || [];
        const isAdjacent = adjacent.includes(move.to);

        if (!isAdjacent) {
          // Army is moving to non-adjacent location - requires convoy
          const convoyKey = `${move.from}->${move.to}`;
          const convoys = convoyOrders.get(convoyKey) || [];

          if (convoys.length === 0) {
            // No convoy available
            results.push({
              country: move.country,
              unit: move.unit,
              from: move.from,
              to: move.to,
              action: 'move',
              success: false,
              dislodged: false,
              reason: `No convoy available from ${move.from} to ${move.to}`
            });
            continue;
          }

          // Check if any convoying fleet is disrupted
          let convoyDisrupted = false;
          for (const convoyFleet of convoys) {
            // Convoy is disrupted if the fleet is attacked
            const fleetAttacked = moves.some(m =>
              m.action === 'move' &&
              m.to === convoyFleet.from &&
              m.valid
            );

            if (fleetAttacked) {
              convoyDisrupted = true;
              break;
            }
          }

          if (convoyDisrupted) {
            results.push({
              country: move.country,
              unit: move.unit,
              from: move.from,
              to: move.to,
              action: 'move',
              success: false,
              dislodged: false,
              reason: `Convoy disrupted - convoying fleet was attacked`
            });
            continue;
          }

          // Convoy is valid and not disrupted - continue with normal resolution
        }
      }

      const key = `${move.from}->${move.to}`;
      const myStrength = strengths[key] || 1;
      const competitors = movesByDestination[move.to] || [];

      // Check if there's a unit currently in the destination
      // Note: In initial positions, we need to check starting units
      // For now, we'll assume destination is empty unless another unit is moving there
      const otherMoves = competitors.filter(m => m.from !== move.from);

      // Check if destination is being vacated (unit moving out successfully)
      // For simplicity in Spring 1901, we'll check if there's a move FROM the destination
      const unitLeavingDestination = movesBySource[move.to];

      // CRITICAL: Check for head-to-head swap
      // If A->B and B->A, both moves must fail (neither can swap places)
      const isHeadToHeadSwap = unitLeavingDestination &&
                                unitLeavingDestination.action === 'move' &&
                                unitLeavingDestination.to === move.from;

      // DIPLOMACY RULE FIX: A province is only vacated if the unit moving out is part of a valid closed cycle
      // We cannot determine this in the first pass, so we'll be conservative:
      // - Only consider it vacated if there's no unit at all, OR
      // - The unit is moving to a space that doesn't create a dependency chain (handled in second pass)
      // For now, we DON'T assume the space is vacated just because a unit is trying to move out
      const destinationIsVacated = false; // Will be resolved in iterative second pass

      // Check if there's a unit holding OR supporting OR trying to move at the destination
      // All of these mean the space is currently occupied
      const holdingUnit = (unitLeavingDestination?.action === 'hold' ||
                          unitLeavingDestination?.action === 'support' ||
                          unitLeavingDestination?.action === 'move')
        ? unitLeavingDestination
        : null;

      // Handle head-to-head swap - check relative strengths
      if (isHeadToHeadSwap) {
        // Calculate opponent's strength (their move from our destination to our origin)
        const opponentKey = `${move.to}->${move.from}`;
        const opponentStrength = strengths[opponentKey] || 1;

        if (myStrength > opponentStrength) {
          // We have superior strength - our move succeeds, opponent is dislodged
          results.push({
            country: move.country,
            unit: move.unit,
            from: move.from,
            to: move.to,
            action: 'move',
            success: true,
            dislodged: false,
            strength: myStrength,
            reason: `Dislodged defender in head-to-head (strength ${myStrength} vs ${opponentStrength})`
          });
        } else if (myStrength < opponentStrength) {
          // Opponent has superior strength - our move fails
          results.push({
            country: move.country,
            unit: move.unit,
            from: move.from,
            to: move.to,
            action: 'move',
            success: false,
            dislodged: false,
            strength: myStrength,
            reason: `Head-to-head failed - opponent has superior strength (strength ${myStrength} vs ${opponentStrength})`
          });
        } else {
          // Equal strength - both moves fail (true swap prevention)
          results.push({
            country: move.country,
            unit: move.unit,
            from: move.from,
            to: move.to,
            action: 'move',
            success: false,
            dislodged: false,
            strength: myStrength,
            reason: `Head-to-head swap prevented - ${move.from} and ${move.to} cannot exchange positions [Strength: ${myStrength}]`
          });
        }
        continue;
      }

      if (otherMoves.length === 0 && destinationIsVacated) {
        // No competition and space is being vacated - move succeeds
        // NOTE: This will never trigger now (destinationIsVacated = false)
        // Cycles will be resolved in the iterative second pass
        results.push({
          country: move.country,
          unit: move.unit,
          from: move.from,
          to: move.to,
          action: 'move',
          success: true,
          dislodged: false,
          strength: myStrength
        });
      } else if (otherMoves.length === 0 && holdingUnit && holdingUnit.action !== 'move') {
        // No competition but there's a unit holding/supporting at destination
        // Get defender's strength (may have defensive supports)
        const defenseStrength = holdStrengths[move.to] || 1;

        // Attack succeeds only if attacker has strength > defender's strength
        if (myStrength > defenseStrength) {
          results.push({
            country: move.country,
            unit: move.unit,
            from: move.from,
            to: move.to,
            action: 'move',
            success: true,
            dislodged: false,
            strength: myStrength,
            reason: `Dislodged defender (strength ${myStrength} vs ${defenseStrength})`
          });
        } else {
          // Bounce - attacker strength <= defender strength
          results.push({
            country: move.country,
            unit: move.unit,
            from: move.from,
            to: move.to,
            action: 'move',
            success: false,
            dislodged: false,
            strength: myStrength,
            reason: `Bounced - destination occupied by holding unit (strength ${myStrength} vs ${defenseStrength})`
          });
        }
      } else if (otherMoves.length === 0 && holdingUnit && holdingUnit.action === 'move') {
        // No competition but there's a unit trying to move from the destination
        // Check if we have enough strength to dislodge (if the destination unit's move fails)
        const defenseStrength = holdStrengths[move.to] || 1;

        if (myStrength > defenseStrength) {
          // Have enough strength to dislodge if destination unit's move fails
          // Mark as successful (destination unit will be marked as dislodged later if their move fails)
          results.push({
            country: move.country,
            unit: move.unit,
            from: move.from,
            to: move.to,
            action: 'move',
            success: true,
            dislodged: false,
            strength: myStrength,
            reason: `Can dislodge destination unit (strength ${myStrength} vs ${defenseStrength})`
          });
        } else {
          // Not enough strength to dislodge - needs to be resolved in second pass
          // If destination unit successfully moves out, this can succeed
          // If destination unit fails to move, this should fail
          results.push({
            country: move.country,
            unit: move.unit,
            from: move.from,
            to: move.to,
            action: 'move',
            success: false,
            dislodged: false,
            strength: myStrength,
            reason: `Destination occupied - waiting for cycle resolution`
          });
        }
      } else if (otherMoves.length === 0 && !holdingUnit) {
        // No competition and space is truly empty - move succeeds
        results.push({
          country: move.country,
          unit: move.unit,
          from: move.from,
          to: move.to,
          action: 'move',
          success: true,
          dislodged: false,
          strength: myStrength
        });
      } else {
        // Multiple units competing for same space - check strengths
        let maxOtherStrength = 0;
        const bouncedWith: string[] = [];

        for (const other of otherMoves) {
          const otherKey = `${other.from}->${other.to}`;
          const otherStrength = strengths[otherKey] || 1;
          if (otherStrength > maxOtherStrength) {
            maxOtherStrength = otherStrength;
          }
          if (otherStrength >= myStrength) {
            bouncedWith.push(other.from);
          }
        }

        if (myStrength > maxOtherStrength) {
          results.push({
            country: move.country,
            unit: move.unit,
            from: move.from,
            to: move.to,
            action: 'move',
            success: true,
            dislodged: false,
            strength: myStrength,
            reason: `Won with strength ${myStrength} vs ${maxOtherStrength}`
          });
        } else {
          results.push({
            country: move.country,
            unit: move.unit,
            from: move.from,
            to: move.to,
            action: 'move',
            success: false,
            dislodged: false,
            strength: myStrength,
            bouncedWith,
            reason: bouncedWith.length > 0 ? `Bounced (strength ${myStrength} tied with ${maxOtherStrength})` : undefined
          });
        }
      }
      continue;
    }

    if (move.action === 'support') {
      results.push({
        country: move.country,
        unit: move.unit,
        from: move.from,
        action: 'support',
        success: true,
        dislodged: false,
        reason: move.supportTarget ? `Supporting ${move.supportTarget.from} to ${move.supportTarget.to}` : undefined
      });
    }

    if (move.action === 'convoy') {
      // Check if convoy was disrupted
      const fleetAttacked = moves.some(m =>
        m.action === 'move' &&
        m.to === move.from &&
        m.valid
      );

      results.push({
        country: move.country,
        unit: move.unit,
        from: move.from,
        action: 'convoy',
        success: !fleetAttacked,
        dislodged: false,
        reason: move.convoyTarget ? `Convoying ${move.convoyTarget.from} to ${move.convoyTarget.to}${fleetAttacked ? ' (disrupted)' : ''}` : undefined
      });
    }
  }

  // ITERATIVE SECOND PASS: Resolve movement cycles and dependencies
  // This handles:
  // 1. Valid closed cycles: A->B->C->A (all succeed together)
  // 2. Failed chains: A->B->C where C doesn't move (all fail)
  // 3. Cascading failures through multiple levels
  let changesOccurred = true;
  let iterationCount = 0;
  const maxIterations = 10; // Safety limit to prevent infinite loops

  while (changesOccurred && iterationCount < maxIterations) {
    changesOccurred = false;
    iterationCount++;

    // Build maps of successful and failed moves
    const successfulMoves = new Set<string>(); // Locations that units successfully left
    const failedMoves = new Set<string>(); // Locations with units that failed to move

    for (const result of results) {
      if (result.action === 'move' && result.from) {
        if (result.success && result.to) {
          successfulMoves.add(result.from);
        } else if (!result.success) {
          failedMoves.add(result.from);
        }
      }
    }

    // FIRST: Detect and resolve complete movement cycles
    // Find all moves waiting for cycle resolution
    const pendingMoves = results.filter(r =>
      r.action === 'move' &&
      !r.success &&
      r.to &&
      r.reason === 'Destination occupied - waiting for cycle resolution'
    );

    for (const pendingMove of pendingMoves) {
      // Check if this move is part of a complete cycle
      const cycle = findCompleteCycle(pendingMove.from, movesBySource, pendingMoves.map(m => m.from));

      if (cycle && cycle.length > 0) {
        // Found a complete cycle! Check if it can proceed
        // A cycle can proceed if no unit in it is being attacked from outside with enough strength
        let cycleCanProceed = true;

        for (const loc of cycle) {
          // Check if this location is being attacked from outside the cycle
          const attackersFromOutside = moves.filter(m =>
            m.action === 'move' &&
            m.to === loc &&
            !cycle.includes(m.from) &&
            m.valid
          );

          if (attackersFromOutside.length > 0) {
            // Check if any attacker has enough strength to disrupt
            for (const attacker of attackersFromOutside) {
              const attackStrength = strengths[`${attacker.from}->${attacker.to}`] || 1;
              const defenseStrength = holdStrengths[loc] || 1;
              if (attackStrength > defenseStrength) {
                cycleCanProceed = false;
                break;
              }
            }
          }

          if (!cycleCanProceed) break;
        }

        if (cycleCanProceed) {
          // Mark all moves in the cycle as successful
          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.action === 'move' && cycle.includes(result.from)) {
              if (!result.success) {
                results[i] = {
                  ...result,
                  success: true,
                  reason: `Part of valid movement cycle`
                };
                changesOccurred = true;
              }
            }
          }
        }
      }
    }

    // SECOND: Resolve moves depending on now-successful moves
    for (let i = 0; i < results.length; i++) {
      const result = results[i];

      // Check failed moves that might now succeed because destination was vacated
      if (result.action === 'move' && !result.success && result.to &&
          result.reason === 'Destination occupied - waiting for cycle resolution') {

        // Check if destination was vacated by a successful move
        const destinationMoveResult = results.find(r =>
          r.action === 'move' &&
          r.from === result.to
        );

        if (destinationMoveResult && destinationMoveResult.success) {
          // Destination unit successfully moved - but was it part of a cycle?
          // Only allow this move if:
          // 1. The destination move was part of a cycle (and we can join that cycle), OR
          // 2. We're part of the same cycle as the destination move

          const destWasPartOfCycle = destinationMoveResult.reason?.includes('Part of valid movement cycle');

          if (destWasPartOfCycle) {
            // Check if we're also part of that cycle
            const weAreInCycle = findCompleteCycle(result.from, movesBySource, pendingMoves.map(m => m.from));

            if (weAreInCycle && weAreInCycle.includes(result.to)) {
              // We're part of the same cycle - can succeed
              results[i] = {
                ...result,
                success: true,
                reason: `Part of valid movement cycle`
              };
              changesOccurred = true;
            }
          }
          // If destination moved by dislodging (not part of a cycle), DON'T allow follow-the-leader
        }
      }

      // Check moves marked as successful but destination actually didn't vacate
      if (result.action === 'move' && result.success && result.to) {
        const unitAtDestination = movesBySource[result.to];

        if (unitAtDestination && unitAtDestination.action === 'move') {
          // Check if that unit's move actually succeeded
          const destMoveResult = results.find(r =>
            r.action === 'move' &&
            r.from === result.to
          );

          if (destMoveResult && !destMoveResult.success) {
            // Destination unit failed to move - space is still occupied
            // Check if this move had enough strength to dislodge
            const defenseStrength = holdStrengths[result.to] || 1;
            const attackStrength = result.strength || 1;

            if (attackStrength <= defenseStrength) {
              // Not enough strength to dislodge - change to failed
              results[i] = {
                ...result,
                success: false,
                reason: `Bounced - destination occupied by unit that failed to move (strength ${attackStrength} vs ${defenseStrength})`
              };
              changesOccurred = true;
            }
          }
        }
      }
    }
  }

  // Helper function to detect if a move is part of a closed movement cycle
  function detectMovementCycle(startLocation: string, moveMap: Record<string, Move>): boolean {
    const visited = new Set<string>();
    let current = startLocation;

    // Follow the chain of moves
    while (current) {
      if (visited.has(current)) {
        // Found a cycle - check if it includes the starting location
        return current === startLocation;
      }

      visited.add(current);
      const moveFromCurrent = moveMap[current];

      if (!moveFromCurrent || moveFromCurrent.action !== 'move' || !moveFromCurrent.to) {
        // Chain ends without cycling back
        return false;
      }

      current = moveFromCurrent.to;

      // Safety check: if chain is too long, it's not a simple cycle
      if (visited.size > 10) {
        return false;
      }
    }

    return false;
  }

  // Helper function to find a complete movement cycle starting from a location
  // Returns the array of locations in the cycle, or null if no complete cycle found
  function findCompleteCycle(
    startLocation: string,
    moveMap: Record<string, Move>,
    pendingLocations: string[]
  ): string[] | null {
    const visited: string[] = [];
    let current = startLocation;

    // Follow the chain of moves
    while (current) {
      // Check if we've returned to the start - found a complete cycle!
      if (current === startLocation && visited.length > 0) {
        return visited;
      }

      // Check if we've visited this location before (but not the start)
      if (visited.includes(current)) {
        // Found a cycle but it doesn't include our starting point
        return null;
      }

      visited.push(current);
      const moveFromCurrent = moveMap[current];

      // Check if this location has a pending move
      if (!moveFromCurrent || moveFromCurrent.action !== 'move' || !moveFromCurrent.to) {
        // Chain ends - not a cycle
        return null;
      }

      current = moveFromCurrent.to;

      // Safety check: if chain is too long, abort
      if (visited.length > 10) {
        return null;
      }
    }

    return null;
  }

  return results;
}

/**
 * Parse a retreat order from a string like "F London -> Wales" or "F London DISBAND"
 */
export function parseRetreatOrder(orderText: string, country: string): RetreatOrder | null {
  const trimmed = orderText.trim();

  // Pattern: "F London -> Wales" or "A Vienna DISBAND"
  const retreatMatch = trimmed.match(/^([AF])\s+(.+?)\s+(?:->|to)\s+(.+)$/i);
  const disbandMatch = trimmed.match(/^([AF])\s+(.+?)\s+DISBAND$/i);

  if (retreatMatch) {
    const [, type, from, to] = retreatMatch;
    return {
      country,
      unit: { type: type as 'A' | 'F', location: from.trim() },
      from: from.trim(),
      to: to.trim()
    };
  }

  if (disbandMatch) {
    const [, type, from] = disbandMatch;
    return {
      country,
      unit: { type: type as 'A' | 'F', location: from.trim() },
      from: from.trim(),
      to: undefined // disband
    };
  }

  return null;
}

/**
 * Resolve retreat orders
 */
export function resolveRetreats(
  retreatOrders: RetreatOrder[],
  occupiedTerritories: Set<string>
): RetreatResult[] {
  const results: RetreatResult[] = [];

  // Group retreat orders by destination
  const retreatsToDestination: Record<string, RetreatOrder[]> = {};

  for (const order of retreatOrders) {
    // Handle disbands immediately
    if (!order.to) {
      results.push({
        country: order.country,
        unit: order.unit,
        from: order.from,
        to: undefined,
        success: true,
        disbanded: true,
        reason: 'Unit voluntarily disbanded'
      });
      continue;
    }

    // Validate adjacency
    const adjacentTerritories = adjacencies[order.from] || [];
    if (!adjacentTerritories.includes(order.to)) {
      results.push({
        country: order.country,
        unit: order.unit,
        from: order.from,
        to: order.to,
        success: false,
        disbanded: true,
        reason: `${order.to} is not adjacent to ${order.from}`
      });
      continue;
    }

    // Validate destination is not occupied
    if (occupiedTerritories.has(order.to)) {
      results.push({
        country: order.country,
        unit: order.unit,
        from: order.from,
        to: order.to,
        success: false,
        disbanded: true,
        reason: `${order.to} is already occupied`
      });
      continue;
    }

    // Group by destination to detect conflicts
    if (!retreatsToDestination[order.to]) {
      retreatsToDestination[order.to] = [];
    }
    retreatsToDestination[order.to].push(order);
  }

  // Resolve conflicts (multiple units retreating to same space)
  for (const [destination, orders] of Object.entries(retreatsToDestination)) {
    if (orders.length > 1) {
      // Multiple units trying to retreat to same space - all are destroyed
      for (const order of orders) {
        results.push({
          country: order.country,
          unit: order.unit,
          from: order.from,
          to: destination,
          success: false,
          disbanded: true,
          reason: `Retreat failed - multiple units attempted to retreat to ${destination}`
        });
      }
    } else {
      // Single unit retreating - success
      const order = orders[0];
      results.push({
        country: order.country,
        unit: order.unit,
        from: order.from,
        to: destination,
        success: true,
        disbanded: false,
        reason: `Successfully retreated to ${destination}`
      });
    }
  }

  return results;
}

/**
 * Calculate supply center ownership based on current unit positions
 * Supply centers retain their previous owner unless an enemy unit occupies them
 */
export function calculateSupplyCenterOwnership(
  unitPositions: Record<string, { type: 'A' | 'F'; location: string }[]>,
  supplyCenters: string[],
  previousOwnership?: Record<string, string>
): Record<string, string> {
  const ownership: Record<string, string> = previousOwnership ? { ...previousOwnership } : {};

  // For each supply center, check if a unit is occupying it
  for (const sc of supplyCenters) {
    for (const [country, units] of Object.entries(unitPositions)) {
      if (units.some(unit => unit.location === sc)) {
        // A unit is on this SC - transfer ownership to that country
        ownership[sc] = country;
        break;
      }
    }
  }

  return ownership;
}

/**
 * Calculate how many builds or disbands each country needs
 */
export function calculateBuildsDisbands(
  supplyCenterCounts: Record<string, number>,
  unitCounts: Record<string, number>
): Record<string, { builds: number; disbands: number }> {
  const result: Record<string, { builds: number; disbands: number }> = {};

  for (const country in supplyCenterCounts) {
    const scCount = supplyCenterCounts[country] || 0;
    const unitCount = unitCounts[country] || 0;
    const difference = scCount - unitCount;

    result[country] = {
      builds: Math.max(0, difference),
      disbands: Math.max(0, -difference)
    };
  }

  return result;
}

/**
 * Parse build/disband orders from text
 */
export function parseBuildDisbandOrder(
  orderText: string,
  country: string
): BuildOrder | DisbandOrder | null {
  const trimmed = orderText.trim();

  // Pattern: "BUILD A Edinburgh" or "BUILD F Liverpool" or "BUILD F St Petersburg (nc)"
  // We ignore coast specifications - they're captured but discarded
  const buildMatch = trimmed.match(/^BUILD\s+([AF])\s+(.+?)(?:\s+\((?:n|s)c?\))?$/i);
  if (buildMatch) {
    const [, type, location] = buildMatch;
    // Normalize location and strip any remaining coast indicators
    let cleanLocation = location.trim()
      .replace(/\s*\((?:north|south|n|s)(?:\s*coast|c)?\)\s*$/i, '') // Remove (nc), (sc), (north coast), etc.
      .replace(/\s+(?:nc|sc|north coast|south coast)\s*$/i, ''); // Remove nc, sc at end
    const normalizedLocation = normalizeLocation(cleanLocation);
    return {
      country,
      type: type as 'A' | 'F',
      location: normalizedLocation,
      coast: undefined // Don't use coasts
    } as BuildOrder;
  }

  // Pattern: "DISBAND F Trieste" or "DISBAND A Vienna"
  const disbandMatch = trimmed.match(/^DISBAND\s+([AF])\s+(.+)$/i);
  if (disbandMatch) {
    const [, type, location] = disbandMatch;
    // Normalize location and strip any coast indicators
    let cleanLocation = location.trim()
      .replace(/\s*\((?:north|south|n|s)(?:\s*coast|c)?\)\s*$/i, '')
      .replace(/\s+(?:nc|sc|north coast|south coast)\s*$/i, '');
    const normalizedLocation = normalizeLocation(cleanLocation);
    return {
      country,
      unit: { type: type as 'A' | 'F', location: normalizedLocation },
      location: normalizedLocation
    } as DisbandOrder;
  }

  return null;
}

/**
 * Validate and execute build orders
 */
export function validateBuildOrder(
  order: BuildOrder,
  homeSupplyCenters: string[],
  currentUnits: { type: 'A' | 'F'; location: string }[],
  waterSpaces: Set<string>
): { valid: boolean; reason?: string } {
  // 1. Location must be a home supply center
  if (!homeSupplyCenters.includes(order.location)) {
    return { valid: false, reason: `${order.location} is not a home supply center` };
  }

  // 2. Location must be unoccupied
  if (currentUnits.some(unit => unit.location === order.location)) {
    return { valid: false, reason: `${order.location} is occupied` };
  }

  // 3. If building a fleet, location must border water
  if (order.type === 'F') {
    const adjacentTerritories = adjacencies[order.location] || [];
    const bordersWater = adjacentTerritories.some(territory => waterSpaces.has(territory));
    if (!bordersWater) {
      return { valid: false, reason: `${order.location} does not border water (cannot build fleet)` };
    }
  }

  return { valid: true };
}
