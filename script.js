document.addEventListener('DOMContentLoaded', () => {
    const gameLogTextarea = document.getElementById('game-log');
    const statsTableBody = document.querySelector('#stats-table tbody');
    const resetButton = document.getElementById('reset-button');
    const errorDisplay = document.getElementById('error-display');

    // --- Event Listeners ---
    gameLogTextarea.addEventListener('input', countGames);
    resetButton.addEventListener('click', () => {
        gameLogTextarea.value = '';
        countGames();
    });
    
    // Initial count in case of pre-filled textarea (e.g., browser refresh)
    countGames();

    /**
     * Main function to process the text and display stats.
     */
    function countGames() {
        const rawText = gameLogTextarea.value;
        const lines = rawText.split('\n');
        const playerCounts = new Map();
        let errors = [];

        lines.forEach((rawLine, index) => {
            // 1. Clean the line
            let cleanedLine = rawLine
                .replace(/^\s*\d+\.\s*/, '')
                .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '') 
                .trim();

            if (cleanedLine === '') {
                return; // Skip empty lines
            }

            // 2. Find the score
            const scoreRegex = /(\d{1,2})\s*-\s*(\d{1,2})/;
            const scoreMatch = cleanedLine.match(scoreRegex);
            
            if (!scoreMatch) {
                // ✅ NEW: Accept lines with exactly 4 player names (no score)
                const players = cleanedLine.split(/\s+/).filter(name => name);
                if (players.length === 4) {
                    players.forEach(player => {
                        const currentCount = playerCounts.get(player) || 0;
                        playerCounts.set(player, currentCount + 1);
                    });
                    return; // ✅ Don't push error, just count it
                }
                errors.push(`Line ${index + 1}: Invalid format. Could not find a score (e.g., 21-15).`);
                return; 
            }

            // 3. Extract player names
            const scoreIndex = scoreMatch.index;
            const team1Text = cleanedLine.substring(0, scoreIndex).trim();
            const team2Text = cleanedLine.substring(scoreIndex + scoreMatch[0].length).trim();

            if (!team1Text || !team2Text) {
                errors.push(`Line ${index + 1}: Missing players on one or both teams.`);
                return;
            }

            const team1Players = team1Text.split(/\s+/).filter(name => name);
            const team2Players = team2Text.split(/\s+/).filter(name => name);
            const allPlayers = [...team1Players, ...team2Players];

            // 4. Update counts
            allPlayers.forEach(player => {
                const currentCount = playerCounts.get(player) || 0;
                playerCounts.set(player, currentCount + 1);
            });
        });

        // 5. Display errors or results
        displayErrors(errors);
        displayStats(playerCounts);
    }

    /**
     * Displays validation errors to the user.
     * @param {string[]} errors - An array of error messages.
     */
    function displayErrors(errors) {
        if (errors.length > 0) {
            errorDisplay.textContent = errors.join('\n');
            errorDisplay.style.display = 'block';
        } else {
            errorDisplay.style.display = 'none';
        }
    }

    /**
     * Sorts player data and renders it into the HTML table.
     * @param {Map<string, number>} playerCounts - A map of player names to their game counts.
     */
    function displayStats(playerCounts) {
        // Clear previous results
        statsTableBody.innerHTML = '';

        // Sort players by game count (descending)
        const sortedPlayers = [...playerCounts.entries()].sort((a, b) => b[1] - a[1]);

        if (sortedPlayers.length === 0) {
            const row = statsTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 2;
            cell.textContent = 'No player data to display.';
            cell.style.textAlign = 'center';
            return;
        }

        // Populate the table with new results
        sortedPlayers.forEach(([name, count]) => {
            const row = statsTableBody.insertRow();
            const nameCell = row.insertCell();
            const countCell = row.insertCell();

            nameCell.textContent = name;
            countCell.textContent = count;
        });
    }
});
