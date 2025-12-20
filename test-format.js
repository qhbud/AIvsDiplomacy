// Test what formatBoardState returns

const unitPositions = {
  'England': ['F London', 'F Edinburgh', 'A Liverpool'],
  'France': ['A Picardy', 'A Spain', 'F Mid-Atlantic Ocean'],
  'Germany': ['F Holland', 'A Kiel', 'A Ruhr'],
  'Italy': ['F Ionian Sea', 'A Apulia', 'A Venice'],
  'Austria-Hungary': ['A Vienna', 'A Budapest', 'F Trieste'],
  'Russia': ['A Ukraine', 'A Galicia', 'F Sevastopol', 'F Gulf of Bothnia'],
  'Turkey': ['A Bulgaria', 'A Armenia', 'F Ankara']
};

function formatBoardState(unitPositions, supplyCenterOwnership, viewingCountry) {
  let boardState = `## Current Board State\n\n`;

  // Sort countries alphabetically for consistent display
  const sortedCountries = Object.keys(unitPositions).sort();

  for (const country of sortedCountries) {
    const units = unitPositions[country];
    if (units && units.length > 0) {
      boardState += `**${country}**: ${units.join(', ')}\n\n`;
    }
  }

  return boardState;
}

const result = formatBoardState(unitPositions);
console.log('Result:\n');
console.log(result);
console.log('---\n');
console.log(`Length: ${result.length}`);
console.log(`Has Austria-Hungary: ${result.includes('Austria-Hungary')}`);
