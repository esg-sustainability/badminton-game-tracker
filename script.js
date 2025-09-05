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

function sanitizeName(name) {
  return name.replace(/[\u200B-\u200D\uFEFF]/g, "").trim(); // remove zero-width characters
}

function processGames() {
  const input = gameInput.value.trim();
  const lines = input.split("\n");
  const playerCount = {};
  let errors = [];

  lines.forEach((line, idx) => {
    // Remove numbering like "1. " or "2. "
    const cleanedLine = line.replace(/^\s*\d+\.\s*/, '').trim();

    const match = cleanedLine.match(/^(.+?)\s+(\d{1,2}-\d{1,2})\s+(.+)$/);

    if (!match) {
      errors.push(`Line ${idx + 1} is invalid: "${line}"`);
      return;
    }

    const [_, team1, score, team2] = match;
    const team1Players = team1.trim().split(/\s+/).map(sanitizeName);
    const team2Players = team2.trim().split(/\s+/).map(sanitizeName);

    if (team1Players.length !== 2 || team2Players.length !== 2) {
      errors.push(`Line ${idx + 1} must have 2 players on each team: "${line}"`);
      return;
    }

    [...team1Players, ...team2Players].forEach(player => {
      if (!player) return;
      const key = player;
      playerCount[key] = (playerCount[key] || 0) + 1;
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
