// DOM Elements
const gameInput = document.getElementById('gameInput');
const countButton = document.getElementById('countButton');
const resetButton = document.getElementById('resetButton');
const errorSection = document.getElementById('errorSection');
const resultsSection = document.getElementById('resultsSection');
const playerList = document.getElementById('playerList');
const totalGamesElement = document.getElementById('totalGames');
const errorText = document.querySelector('.error-text');

// Event Listeners
countButton.addEventListener('click', countGames);
resetButton.addEventListener('click', resetAll);

// Enhanced Unicode normalization function
function normalizeText(text) {
    if (!text) return '';
    
    return text
        // Normalize Unicode (handles various Unicode forms)
        .normalize('NFKD')
        // Remove zero-width characters and other invisible characters
        .replace(/[\u200B-\u200D\uFEFF\u00AD\u061C\u180E\u2060-\u2069\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
        // Remove other common invisible/control characters
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        // Replace multiple whitespace with single space
        .replace(/\s+/g, ' ')
        // Trim whitespace from start and end
        .trim();
}

// Enhanced input cleaning function
function cleanInput(input) {
    if (!input) return '';
    
    return input
        // Normalize the entire input first
        .normalize('NFKD')
        // Remove zero-width and invisible characters
        .replace(/[\u200B-\u200D\uFEFF\u00AD\u061C\u180E\u2060-\u2069\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
        // Remove control characters except newlines and tabs
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
        // Normalize line endings
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Clean up extra whitespace but preserve line structure
        .replace(/[ \t]+/g, ' ')
        // Remove trailing spaces from each line
        .replace(/[ \t]+$/gm, '')
        // Remove leading spaces from each line (but preserve intentional indentation)
        .replace(/^[ \t]+/gm, '')
        .trim();
}

// Show error function
function showError(message) {
    errorText.textContent = message;
    errorSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
}

// Hide error function
function hideError() {
    errorSection.classList.add('hidden');
}

// Parse game line function with enhanced error handling
function parseGameLine(line, lineNumber) {
    // Clean and normalize the line
    const cleanLine = normalizeText(line);
    
    if (!cleanLine) {
        return null; // Skip empty lines
    }
    
    // Remove numbering (e.g., "1.", "2.", etc.)
    const withoutNumbering = cleanLine.replace(/^\d+\.\s*/, '');
    
    if (!withoutNumbering) {
        throw new Error(`Line ${lineNumber}: Empty line after removing numbering`);
    }
    
    // Enhanced regex pattern to handle various score formats
    // Matches: "21-12", "21 - 12", "21- 12", "21 -12", "21 12", etc.
    const scorePattern = /\b(\d{1,2})\s*[-\s]\s*(\d{1,2})\b/;
    const scoreMatch = withoutNumbering.match(scorePattern);
    
    if (!scoreMatch) {
        throw new Error(`Line ${lineNumber}: No valid score found. Expected format like "21-12" or "21 - 12". Line content: "${cleanLine}"`);
    }
    
    const scoreIndex = scoreMatch.index;
    const scoreLength = scoreMatch[0].length;
    
    // Split into team1 and team2 based on score position
    const team1Text = withoutNumbering.substring(0, scoreIndex).trim();
    const team2Text = withoutNumbering.substring(scoreIndex + scoreLength).trim();
    
    if (!team1Text) {
        throw new Error(`Line ${lineNumber}: No players found before the score. Line: "${cleanLine}"`);
    }
    
    if (!team2Text) {
        throw new Error(`Line ${lineNumber}: No players found after the score. Line: "${cleanLine}"`);
    }
    
    // Extract player names (split by spaces, each word is a player)
    const team1Players = team1Text.split(/\s+/).map(name => normalizeText(name)).filter(name => name.length > 0);
    const team2Players = team2Text.split(/\s+/).map(name => normalizeText(name)).filter(name => name.length > 0);
    
    // Validate that we have players
    if (team1Players.length === 0) {
        throw new Error(`Line ${lineNumber}: No valid players found in team 1. Line: "${cleanLine}"`);
    }
    
    if (team2Players.length === 0) {
        throw new Error(`Line ${lineNumber}: No valid players found in team 2. Line: "${cleanLine}"`);
    }
    
    // Check for suspiciously short player names (might indicate parsing issues)
    const allPlayers = [...team1Players, ...team2Players];
    const shortNames = allPlayers.filter(name => name.length < 2);
    if (shortNames.length > 0) {
        console.warn(`Line ${lineNumber}: Found potentially short player names: ${shortNames.join(', ')}. Line: "${cleanLine}"`);
    }
    
    return {
        team1: team1Players,
        team2: team2Players,
        score: scoreMatch[0],
        line: cleanLine
    };
}

// Main count games function
function countGames() {
    hideError();
    
    const input = gameInput.value;
    
    if (!input.trim()) {
        showError('Please enter some game results to count.');
        return;
    }
    
    // Clean the input thoroughly
    const cleanedInput = cleanInput(input);
    const lines = cleanedInput.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) {
        showError('No valid game lines found. Please check your input format.');
        return;
    }
    
    const playerCounts = new Map();
    const games = [];
    const errors = [];
    
    // Process each line
    lines.forEach((line, index) => {
        try {
            const gameData = parseGameLine(line, index + 1);
            if (gameData) {
                games.push(gameData);
                
                // Count players from both teams
                [...gameData.team1, ...gameData.team2].forEach(player => {
                    const normalizedPlayer = normalizeText(player);
                    if (normalizedPlayer) {
                        playerCounts.set(normalizedPlayer, (playerCounts.get(normalizedPlayer) || 0) + 1);
                    }
                });
            }
        } catch (error) {
            errors.push(error.message);
        }
    });
    
    // Show errors if any
    if (errors.length > 0) {
        showError(`Found ${errors.length} error(s):\n\n${errors.join('\n')}`);
        return;
    }
    
    // Check if we found any valid games
    if (games.length === 0) {
        showError('No valid games found. Please check your input format.\n\nExpected format: "Player1 Player2 21-12 Player3 Player4"');
        return;
    }
    
    // Check if we have any players
    if (playerCounts.size === 0) {
        showError('No players found in the game results.');
        return;
    }
    
    // Sort players by game count (descending) then by name (ascending)
    const sortedPlayers = Array.from(playerCounts.entries())
        .sort((a, b) => {
            if (b[1] !== a[1]) {
                return b[1] - a[1]; // Sort by count descending
            }
            return a[0].localeCompare(b[0]); // Sort by name ascending
        });
    
    // Display results
    displayResults(sortedPlayers, games.length);
}

// Display results function
function displayResults(sortedPlayers, totalGames) {
    // Update total games
    totalGamesElement.textContent = totalGames;
    
    // Clear previous results
    tableBody.innerHTML = '';
    
    // Create table rows
    sortedPlayers.forEach((playerData, index) => {
        const [playerName, gameCount] = playerData;
        
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="player-name-cell">${escapeHtml(playerName)}</td>
            <td class="games-cell">${gameCount}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Show results section
    resultsSection.classList.remove('hidden');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Reset function
function resetAll() {
    gameInput.value = '';
    hideError();
    resultsSection.classList.add('hidden');
    gameInput.focus();
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    gameInput.focus();
    
    // Add some helpful keyboard shortcuts
    gameInput.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to count games
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            countGames();
        }
        
        // Ctrl/Cmd + R to reset (prevent page reload)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            resetAll();
        }
    });
    
    // Auto-resize textarea based on content
    gameInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.max(300, this.scrollHeight) + 'px';
    });
});
