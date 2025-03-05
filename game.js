let currentGame = 1;
let shotsLeft = 12;
let playerScore = 0;
let opponentScore = 0;
let streak = 0;
let isDirectionShown = false;
let shotStartTime;
let currentWindow;
let requiredDirection;
let hasPressed = false;
let playerSeed;
let reactionTimes = [];

const directions = ['↑', '↓', '←', '→'];
const keyMap = {
  'ArrowUp': '↑',
  'ArrowDown': '↓',
  'ArrowLeft': '←',
  'ArrowRight': '→'
};

const baseScenarios = [
  { text: "Open layup to win!", points: 1, baseWindow: 900 },
  { text: "Mid-range jumper with a defender!", points: 2, baseWindow: 700 },
  { text: "Deep three to beat the buzzer!", points: 3, baseWindow: 500 }
];

function getScenarios(seed) {
  const difficultyFactor = (seed - 1) / 15;
  return baseScenarios.map(scenario => ({
    ...scenario,
    window: Math.round(scenario.baseWindow * (1 - difficultyFactor * 0.5)),
    weight: scenario.points === 1 ? (1 - difficultyFactor) :
            scenario.points === 2 ? 1 :
            difficultyFactor
  }));
}

function startGame() {
  playerSeed = parseInt(document.getElementById("seedSelect").value);
  const scenarios = getScenarios(playerSeed);

  const landingPage = document.getElementById("landingPage");
  const gameContainer = document.getElementById("gameContainer");

  landingPage.classList.add("hidden");
  setTimeout(() => {
    landingPage.style.display = "none";
    gameContainer.style.display = "flex";
    document.getElementById("reactionTracker").style.display = "block";
    gameContainer.classList.add("visible");
  }, 500); // Match transition duration

  document.getElementById("seedDisplay").textContent = playerSeed;
  updateStats();
  nextShot(scenarios);
}

function nextShot(scenarios) {
  if (shotsLeft <= 0) {
    if (playerScore > opponentScore) {
      if (currentGame < 6) {
        currentGame++;
        shotsLeft = 12;
        playerScore = 0;
        opponentScore = 0;
        reactionTimes = [];
        document.getElementById("reactionList").innerHTML = "";
        updateStats();
      } else {
        endGame(true);
        return;
      }
    } else {
      endGame(false);
      return;
    }
  }

  const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
  let r = Math.random() * totalWeight;
  let scenario;
  for (let i = 0; i < scenarios.length; i++) {
    r -= scenarios[i].weight;
    if (r <= 0) {
      scenario = scenarios[i];
      break;
    }
  }

  currentWindow = scenario.window;
  let clock = Math.floor(Math.random() * 2) + 1; // 1-3s
  document.getElementById("scenario").textContent = `${scenario.text} ${clock}...`;
  isDirectionShown = false;
  hasPressed = false;
  const countdown = setInterval(() => {
    clock--;
    if (clock > 0) {
      document.getElementById("scenario").textContent = `${scenario.text} ${clock}...`;
    } else {
      clearInterval(countdown);
      document.getElementById("scenario").textContent = scenario.text;
      requiredDirection = directions[Math.floor(Math.random() * directions.length)];
      document.getElementById("direction").textContent = requiredDirection;
      document.getElementById("direction").style.display = "block";
      isDirectionShown = true;
      shotStartTime = Date.now();
    }
  }, 1000);
}

function handleKeyPress(event) {
  if (!isDirectionShown || hasPressed) return;
  hasPressed = true;
  const pressedKey = keyMap[event.key];
  const resultEl = document.getElementById("result");
  const reactionTime = Date.now() - shotStartTime;
  const currentScenarioText = document.getElementById("scenario").textContent;
  const scenarios = getScenarios(playerSeed);
  const scenario = scenarios.find(s => s.text === currentScenarioText);

  let attemptResult;
  if (pressedKey === requiredDirection && reactionTime <= currentWindow) {
    playerScore += scenario.points;
    streak++;
    resultEl.textContent = "Made it!";
    resultEl.style.color = "#28a745"; // Green
    attemptResult = `${reactionTime}ms`;
  } else {
    opponentScore += Math.floor(Math.random() * 2) + 1;
    resultEl.textContent = pressedKey !== requiredDirection ? "Missed! (Wrong direction)" : "Missed! (Too late)";
    resultEl.style.color = "#dc3545"; // Red
    streak = 0;
    attemptResult = "Miss";
  }

  reactionTimes.push({ attempt: 13 - shotsLeft, result: attemptResult });
  updateReactionTracker();

  shotsLeft--;
  updateStats();
  setTimeout(() => {
    document.getElementById("direction").style.display = "none";
    resultEl.textContent = "";
    nextShot(scenarios);
  }, 500);
}

function updateStats() {
  document.getElementById("gameNumber").textContent = currentGame;
  document.getElementById("shotsLeft").textContent = shotsLeft;
  document.getElementById("playerScore").textContent = playerScore;
  document.getElementById("opponentScore").textContent = opponentScore;
  document.getElementById("streak").textContent = streak;
}

function updateReactionTracker() {
  const reactionList = document.getElementById("reactionList");
  reactionList.innerHTML = "";
  reactionTimes.forEach(({ attempt, result }) => {
    const li = document.createElement("li");
    li.textContent = `Shot ${attempt}: ${result}`;
    reactionList.appendChild(li);
  });
}

function endGame(won = false) {
  document.removeEventListener("keydown", handleKeyPress);
  document.getElementById("scenario").textContent = won ?
    `Champion! Seed ${playerSeed} - Final Score: ${playerScore}-${opponentScore}, Longest Streak: ${streak}` :
    `Game Over! Seed ${playerSeed} - Lost Game ${currentGame} (${playerScore}-${opponentScore})`;
}

document.getElementById("startBtn").addEventListener("click", startGame);
document.addEventListener("keydown", handleKeyPress);
