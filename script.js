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

function processGames() {
  const input = gameInput.value.trim();
  const lines = input.split("\n");
  const playerCount = {};
  let errors = [];

  lines.forEach((line, idx) => {
    const match = line.match(/^(.+?)\s+(\d{1,2}-\d{1,2})\s+(.+)$/);

    if (!match) {
      errors.push(`Line ${idx + 1} is invalid: "${line}"`);
      return;
    }

    const [_, team1, score, team2] = match;
    const team1Players = team1.trim().split(/\s+/);
    const team2Players = team2.trim().split(/\s+/);

    if (team1Players.length !== 2 || team2Players.length !== 2) {
      errors.push(`Line ${idx + 1} must have 2 players on each team: "${line}"`);
      return;
    }

    [...team1Players, ...team2Players].forEach(player => {
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
