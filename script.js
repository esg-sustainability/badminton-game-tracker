// DOM Elements
const gameInput = document.getElementById('gameInput');
const countButton = document.getElementById('countButton');
const resetButton = document.getElementById('resetButton');
const errorSection = document.getElementById('errorSection');
const resultsSection = document.getElementById('resultsSection');
const totalGamesElement = document.getElementById('totalGames');
const errorText = document.querySelector('.error-text');
const tableBody = document.getElementById('tableBody');

// Event Listeners
countButton.addEventListener('click', countGames);
resetButton.addEventListener('click', resetAll);

// Normalize text
function normalizeText(text) {
  if (!text) return '';
  return text
    .normalize('NFKD')
    .replace(/[\u200B-\u200D\uFEFF\u00AD\u061C\u180E\u2060-\u2069\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean input
function cleanInput(input) {
  if (!input) return '';
  return input
    .normalize('NFKD')
    .replace(/[\u200B-\u200D\uFEFF\u00AD\u061C\u180E\u2060-\u2069\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]+$/gm, '')
    .replace(/^[ \t]+/gm, '')
    .trim();
}

// Show error
function showError(message) {
  errorText.textContent = message;
  errorSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');
}

// Hide error
function hideError() {
  errorSection.classList.add('hidden');
}

// Parse a single game line
function parseGameLine(line, lineNumber) {
  const cleanLine = normalizeText(line);
  if (!cleanLine) return null;

  const withoutNumbering = cleanLine.replace(/^\d+\.\s*/, '');
  if (!withoutNumbering) {
    throw new Error(`Line ${lineNumber}: Empty line after removing numbering`);
  }

  const scorePattern = /\b(\d{1,2})\s*[-\s]\s*(\d{1,2})\b/;
  const scoreMatch = withoutNumbering.match(scorePattern);
  if (!scoreMatch) {
    throw new Error(`Line ${lineNumber}: No valid score found. Line content: "${cleanLine}"`);
  }

  const scoreIndex = scoreMatch.index;
  const scoreLength = scoreMatch[0].length;

  const team1Text = withoutNumbering.substring(0, scoreIndex).trim();
  const team2Text = withoutNumbering.substring(scoreIndex + scoreLength).trim();

  if (!team1Text) throw new Error(`Line ${lineNumber}: No players found before the score`);
  if (!team2Text) throw new Error(`Line ${lineNumber}: No players found after the score`);

  const team1Players = team1Text.split(/\s+/).map(normalizeText).filter(Boolean);
  const team2Players = team2Text.split(/\s+/).map(normalizeText).filter(Boolean);

  if (team1Players.length === 0) throw new Error(`Line ${lineNumber}: No valid players in team 1`);
  if (team2Players.length === 0) throw new Error(`Line ${lineNumber}: No valid players in team 2`);

  return { team1: team1Players, team2: team2Players, score: scoreMatch[0], line: cleanLine };
}

// Count games
function countGames() {
  hideError();

  const input = gameInput.value;
  if (!input.trim()) {
    showError('Please enter some game results to count.');
    return;
  }

  const cleanedInput = cleanInput(input);
  const lines = cleanedInput.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    showError('No valid game lines found. Please check your input format.');
    return;
  }

  const playerCounts = new Map();
  const games = [];
  const errors = [];

  lines.forEach((line, index) => {
    try {
      const gameData = parseGameLine(line, index + 1);
      if (gameData) {
        games.push(gameData);
        [...gameData.team1, ...gameData.team2].forEach(player => {
          const normalized = normalizeText(player);
          if (normalized) {
            playerCounts.set(normalized, (playerCounts.get(normalized) || 0) + 1);
          }
        });
      }
    } catch (err) {
      errors.push(err.message);
    }
  });

  if (errors.length > 0) {
    showError(`Found ${errors.length} error(s):\n\n${errors.join('\n')}`);
    return;
  }

  if (games.length === 0) {
    showError('No valid games found. Expected format: "Player1 Player2 21-12 Player3 Player4"');
    return;
  }

  if (playerCounts.size === 0) {
    showError('No players found in the game results.');
    return;
  }

  const sortedPlayers = Array.from(playerCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  displayResults(sortedPlayers, games.length);
}

// Display results
function displayResults(sortedPlayers, totalGames) {
  totalGamesElement.textContent = totalGames;
  tableBody.innerHTML = '';
  sortedPlayers.forEach(([name, count]) => {
    const
