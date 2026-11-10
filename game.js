const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startOverlay = document.getElementById("startOverlay");

// --- 1. Images ---
let modiLoaded = false;
let rahulLoaded = false;

const playerImg = new Image();
playerImg.src = "./modi.png";
playerImg.onload = () => { modiLoaded = true; };

const obstacleImg = new Image();
obstacleImg.src = "./rahul.png";
obstacleImg.onload = () => { rahulLoaded = true; };

// --- 2. Audio ---
const bgm = new Audio("./bgm.mp3");
bgm.loop = true;
bgm.volume = 0.45;

const soundGameOver = new Audio("./bye.mp3");
const soundPass = new Audio("./hato.mp3");

let audioUnlocked = false;

function playSound(audio) {
  if (!audioUnlocked) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

// Request real mobile fullscreen mode
function requestFullScreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen().catch(() => {});
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  }
}

// --- 3. Tuned Physics & Slower Speed Settings ---
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem("vikas_high_score") || 0;
let frameCount = 0;

// Slower pacing: reduced from 6 -> 3.8
const baseSpeed = 3.8;
let currentSpeed = baseSpeed;

const groundHeight = 50;
const groundY = canvas.height - groundHeight - 60;

// Player: gentler gravity and jump arc for easy reaction
const player = {
  x: 70,
  y: groundY,
  width: 52,
  height: 60,
  vy: 0,
  gravity: 0.65,        // Reduced from 0.85 (floats longer)
  jumpStrength: -12.5,  // Smooth, high jump
  groundY: groundY,
  isJumping: false
};

// Clouds
const clouds = [
  { x: 120, y: 50, size: 28, speed: 0.8 },
  { x: 420, y: 80, size: 22, speed: 0.5 },
  { x: 700, y: 40, size: 26, speed: 0.7 }
];

// Obstacles: increased interval so obstacles spawn farther apart
let obstacles = [];
const spawnInterval = 145; // Slower spawn rhythm (was 110)

// Universal Action Trigger (Mobile Tap & Keyboard)
function handleAction() {
  if (!audioUnlocked) {
    audioUnlocked = true;
    startOverlay.style.display = "none";
    requestFullScreen();
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

startOverlay.addEventListener("click", () => {
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

// Forgiving Collision Box
function checkCollision(p, obs) {
  const pad = 10; // extra padding so hitboxes are lenient
  return (
    p.x + pad < obs.x + obs.width - pad &&
    p.x + p.width - pad > obs.x + pad &&
    p.y + pad < obs.y + obs.height - pad &&
    p.y + p.height - pad > obs.y + pad
  );
}

// --- 4. Update Loop ---
function update() {
  if (gameOver) return;

  frameCount++;
  // Very slow gradual increase
  currentSpeed = baseSpeed + Math.floor(score / 80) * 0.4;

  // Move clouds
  for (let c of clouds) {
    c.x -= c.speed;
    if (c.x + c.size * 3 < 0) {
      c.x = canvas.width + 60;
      c.y = 30 + Math.random() * 90;
    }
  }

  // Player gravity
  player.vy += player.gravity;
  player.y += player.vy;

  if (player.y >= player.groundY) {
    player.y = player.groundY;
    player.vy = 0;
    player.isJumping = false;
  }

  // Spawn obstacles with plenty of spacing
  if (frameCount % spawnInterval === 0) {
    const obsHeight = 55 + Math.floor(Math.random() * 15);
    obstacles.push({
      x: canvas.width,
      y: canvas.height - groundHeight - obsHeight,
      width: 48,
      height: obsHeight
    });
  }

  // Move obstacles
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

  // Clear passed hurdles
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
  ctx.fillStyle = "#3e5d1a";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // Player (Modi)
  if (modiLoaded && playerImg.complete) {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  } else {
    ctx.fillStyle = "#FF9933";
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = "#000";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("MODI", player.x + 8, player.y + 35);
  }

  // Obstacles (Rahul)
  for (let obs of obstacles) {
    if (rahulLoaded && obstacleImg.complete) {
      ctx.drawImage(obstacleImg, obs.x, obs.y, obs.width, obs.height);
    } else {
      ctx.fillStyle = "#B22222";
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.fillStyle = "#FFF";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("RAHUL", obs.x + 4, obs.y + 30);
    }
  }

  // Score HUD
  ctx.fillStyle = "#1e1e24";
  ctx.font = "bold 20px monospace";
  ctx.fillText("Score: " + score, 24, 34);
  ctx.fillText("High: " + highScore, 24, 58);

  // Game Over Screen
  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("KHATAM! TATA! BYE-BYE!", canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "18px sans-serif";
    ctx.fillText("Score: " + score + "  |  Best: " + highScore, canvas.width / 2, canvas.height / 2 + 18);
    ctx.fillText("Tap to Try Again", canvas.width / 2, canvas.height / 2 + 55);
    ctx.textAlign = "left";
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);