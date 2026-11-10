const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startOverlay = document.getElementById("startOverlay");

// --- 1. Load Images with Robust Load Tracking ---
let modiLoaded = false;
let rahulLoaded = false;

const playerImg = new Image();
playerImg.src = "./modi.png";
playerImg.onload = () => { modiLoaded = true; };
playerImg.onerror = () => { console.warn("modi.png not found or could not load."); };

const obstacleImg = new Image();
obstacleImg.src = "./rahul.png";
obstacleImg.onload = () => { rahulLoaded = true; };
obstacleImg.onerror = () => { console.warn("rahul.png not found or could not load."); };

// --- 2. Load Audio with Fallback Safe-Play ---
const bgm = new Audio("./bgm.mp3");
bgm.loop = true;
bgm.volume = 0.45;

const soundGameOver = new Audio("./bye.mp3");
const soundPass = new Audio("./hato.mp3");

let audioUnlocked = false;

function playSound(audio) {
  if (!audioUnlocked) return;
  audio.currentTime = 0;
  audio.play().catch(e => console.warn("Sound play suppressed:", e));
}

// Start overlay to legally unlock browser audio
startOverlay.addEventListener("click", () => {
  audioUnlocked = true;
  startOverlay.style.display = "none";
  bgm.play().catch(e => console.warn("Autoplay blocked:", e));
  handleAction();
});

// --- 3. State Variables ---
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem("vikas_high_score") || 0;
let frameCount = 0;

let baseSpeed = 6;
let currentSpeed = baseSpeed;

const groundHeight = 40;
const groundY = canvas.height - groundHeight - 55;

// Player Setup
const player = {
  x: 60,
  y: groundY,
  width: 50,
  height: 55,
  vy: 0,
  gravity: 0.85,
  jumpStrength: -14,
  groundY: groundY,
  isJumping: false
};

// Clouds
const clouds = [
  { x: 100, y: 40, size: 28, speed: 1.2 },
  { x: 350, y: 70, size: 22, speed: 0.8 },
  { x: 650, y: 35, size: 26, speed: 1.0 }
];

// Obstacles
let obstacles = [];
const spawnInterval = 110;

// Universal Action Trigger
function handleAction() {
  if (!audioUnlocked) {
    audioUnlocked = true;
    startOverlay.style.display = "none";
    bgm.play().catch(() => {});
  }

  if (gameOver) {
    restartGame();
  } else if (!player.isJumping) {
    player.vy = player.jumpStrength;
    player.isJumping = true;
  }
}

// Controls
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    handleAction();
  }
});

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  handleAction();
}, { passive: false });

canvas.addEventListener("mousedown", () => {
  handleAction();
});

// Restart Game
function restartGame() {
  obstacles = [];
  score = 0;
  frameCount = 0;
  currentSpeed = baseSpeed;
  player.y = player.groundY;
  player.vy = 0;
  player.isJumping = false;
  gameOver = false;

  bgm.currentTime = 0;
  bgm.play().catch(() => {});
}

// Bounding Box Collision
function checkCollision(p, obs) {
  const pad = 6;
  return (
    p.x + pad < obs.x + obs.width - pad &&
    p.x + p.width - pad > obs.x + pad &&
    p.y + pad < obs.y + obs.height - pad &&
    p.y + p.height - pad > obs.y + pad
  );
}

// --- 4. Physics & State Loop ---
function update() {
  if (gameOver) return;

  frameCount++;
  currentSpeed = baseSpeed + Math.floor(score / 50) * 0.8;

  // Move clouds
  for (let c of clouds) {
    c.x -= c.speed;
    if (c.x + c.size * 3 < 0) {
      c.x = canvas.width + 50;
      c.y = 20 + Math.random() * 80;
    }
  }

  // Jump physics
  player.vy += player.gravity;
  player.y += player.vy;

  if (player.y >= player.groundY) {
    player.y = player.groundY;
    player.vy = 0;
    player.isJumping = false;
  }

  // Spawn obstacles
  if (frameCount % spawnInterval === 0) {
    const obsHeight = 52 + Math.floor(Math.random() * 14);
    obstacles.push({
      x: canvas.width,
      y: canvas.height - groundHeight - obsHeight,
      width: 45,
      height: obsHeight
    });
  }

  // Move hurdles & check hits
  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    obs.x -= currentSpeed;

    if (checkCollision(player, obs)) {
      gameOver = true;
      bgm.pause();
      playSound(soundGameOver);

      if (score > highScore) {
        highScore = score;
        localStorage.setItem("vikas_high_score", highScore);
      }
    }
  }

  // Score points & play pass sound
  while (obstacles.length > 0 && obstacles[0].x + obstacles[0].width < 0) {
    obstacles.shift();
    score += 10;
    playSound(soundPass);
  }
}

// --- 5. Render Routine ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Clouds
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  for (let c of clouds) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
    ctx.arc(c.x + c.size * 0.6, c.y - c.size * 0.3, c.size * 0.7, 0, Math.PI * 2);
    ctx.arc(c.x + c.size * 1.2, c.y, c.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ground
  ctx.fillStyle = "#4a6b22";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // Draw Player
  if (modiLoaded && playerImg.complete) {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  } else {
    // Stylized Saffron Avatar with label
    ctx.fillStyle = "#FF9933";
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(player.x + 8, player.y + 12, player.width - 16, player.height - 18);
    ctx.fillStyle = "#000";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("MODI", player.x + 8, player.y + 32);
  }

  // Draw Obstacles
  for (let obs of obstacles) {
    if (rahulLoaded && obstacleImg.complete) {
      ctx.drawImage(obstacleImg, obs.x, obs.y, obs.width, obs.height);
    } else {
      // Crimson barrier with label
      ctx.fillStyle = "#B22222";
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(obs.x, obs.y, obs.width, 5);
      ctx.fillStyle = "#FFF";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("RAHUL", obs.x + 4, obs.y + 28);
    }
  }

  // Score HUD
  ctx.fillStyle = "#1e1e24";
  ctx.font = "bold 18px monospace";
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("High: " + highScore, 20, 52);

  // Game Over
  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 30px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("KHATAM! TATA! BYE-BYE!", canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "18px sans-serif";
    ctx.fillText("Score: " + score + "  |  Best: " + highScore, canvas.width / 2, canvas.height / 2 + 18);
    ctx.fillText("Tap Screen or Press SPACE to Restart", canvas.width / 2, canvas.height / 2 + 55);
    ctx.textAlign = "left";
  }
}

// Game Loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);