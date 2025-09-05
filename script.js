const gameInput = document.getElementById("gameInput");
const playerCountsEl = document.getElementById("playerCounts");
const resetBtn = document.getElementById("resetBtn");
const errorOutput = document.getElementById("errorOutput");

gameInput.addEventListener("input", processGames);
resetBtn.addEventListener("click", () => {
  gameInput.value = "";
  playerCountsEl.innerHTML = "";
  errorOutput.textContent = "";
});

function cleanLine(line) {
  return line
    .replace(/^\s*\d+\.\s*/, '') // Remove numbering like "1. "
    .replace(/[\u200B-\u200D\uFEFF\u2060]/g, '') // Remove invisible characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

function sanitizeName(name) {
  return name.replace(/[\u200B-\u200D\uFEFF\u2060]/g, "").trim();
}

function processGames() {
  const input = gameInput.value.trim();
  const lines = input.split("\n");
  const playerCount = {};
  let errors = [];

  lines.forEach((line, idx) => {
    const originalLine = line;
    const cleanedLine = cleanLine(line);

    // Allow spaces around dash in score: e.g. 21 - 16 or 21-16 or 21 -16
    const match = cleanedLine.match(/^(.+?)\s+(\d{1,2})\s*-\s*(\d{1,2})\s+(.+)$/);

    if (!match) {
      errors.push(`Line ${idx + 1} is invalid: "${originalLine}"`);
      return;
    }

    const team1Raw = match[1];
    const score = `${match[2]}-${match[3]}`;
    const team2Raw = match[4];

    const team1Players = team1Raw.trim().split(/\s+/).map(sanitizeName);
    const team2Players = team2Raw.trim().split(/\s+/).map(sanitizeName);

    if (team1Players.length !== 2 || team2Players.length !== 2) {
      errors.push(`Line ${idx + 1} must have 2 players on each team: "${originalLine}"`);
      return;
    }

    [...team1Players, ...team2Players].forEach(player => {
      if (!player) return;
      playerCount[player] = (playerCount[player] || 0) + 1;
    });
  });

  // Display errors
  errorOutput.textContent = errors.length > 0 ? errors.join("\n") : "";

  // Display player counts
  const sortedPlayers = Object.entries(playerCount)
    .sort((a, b) => b[1] - a[1]);

  playerCountsEl.innerHTML = "";
  sortedPlayers.forEach(([player, count]) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${player}</span><strong>${count} game${count > 1 ? "s" : ""}</strong>`;
    playerCountsEl.appendChild(li);
  });
}
