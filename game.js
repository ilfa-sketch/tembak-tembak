// === Settings ===
const CANVAS_W = 480, CANVAS_H = 800;
const AIRCRAFT_SPEED = 7;
const BULLET_SPEED = 8;
const TARGET_SPEED = 1;
const TARGET_SPAWN_INTERVAL = 1200;
const JOYSTICK_RADIUS = 90, JOYSTICK_HANDLE_RADIUS = 48;

// === Load images ===
const imgAircraft = new Image();
imgAircraft.src = 'https://raw.githubusercontent.com/ilfa-sketch/File-file-gambar-gratis-/refs/heads/main/Untitled3_20250731185108.png';
const imgAnalog = new Image();
imgAnalog.src = 'https://raw.githubusercontent.com/ilfa-sketch/File-file-gambar-gratis-/refs/heads/main/analog.png';
const imgTarget = new Image();
imgTarget.src = 'https://raw.githubusercontent.com/ilfa-sketch/File-file-gambar-gratis-/refs/heads/main/20250731_190602.png';

// === Canvas Setup ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const joystickCanvas = document.getElementById('joystick');
const jctx = joystickCanvas.getContext('2d');

// === Game State ===
let aircraft = { x: CANVAS_W/2, y: CANVAS_H-100, w: 64, h: 64, vx: 0, vy: 0 };
let bullets = [];
let targets = [];
let lastTargetSpawn = 0;
let score = 0;

// === Joystick State ===
let joystick = { active: false, ox: 60, oy: 60, x: 60, y: 60, dx: 0, dy: 0 };

function drawJoystick() {
  // Outer base
  jctx.clearRect(0, 0, 120, 120);
  jctx.globalAlpha = 0.65;
  jctx.drawImage(imgAnalog, 0, 0, 120, 120);
  // Handle
  jctx.globalAlpha = 0.9;
  jctx.beginPath();
  jctx.arc(joystick.x, joystick.y, JOYSTICK_HANDLE_RADIUS, 0, Math.PI*2);
  jctx.fillStyle = "#fff8";
  jctx.fill();
  jctx.globalAlpha = 1.0;
}
function updateJoystickFromEvent(ev) {
  const rect = joystickCanvas.getBoundingClientRect();
  let cx = (ev.touches? ev.touches[0].clientX : ev.clientX) - rect.left;
  let cy = (ev.touches? ev.touches[0].clientY : ev.clientY) - rect.top;
  let dx = cx - joystick.ox, dy = cy - joystick.oy;
  let dist = Math.sqrt(dx*dx + dy*dy);
  if (dist > JOYSTICK_RADIUS) {
    dx *= JOYSTICK_RADIUS/dist;
    dy *= JOYSTICK_RADIUS/dist;
  }
  joystick.x = joystick.ox + dx;
  joystick.y = joystick.oy + dy;
  joystick.dx = dx/JOYSTICK_RADIUS;
  joystick.dy = dy/JOYSTICK_RADIUS;
  drawJoystick();
}
function resetJoystick() {
  joystick.x = joystick.ox; joystick.y = joystick.oy;
  joystick.dx = 0; joystick.dy = 0;
  drawJoystick();
}

// === Controls ===
joystickCanvas.addEventListener('pointerdown', ev => {
  joystick.active = true;
  updateJoystickFromEvent(ev);
  joystickCanvas.setPointerCapture(ev.pointerId);
});
joystickCanvas.addEventListener('pointermove', ev => {
  if (joystick.active) updateJoystickFromEvent(ev);
});
joystickCanvas.addEventListener('pointerup', ev => {
  joystick.active = false;
  resetJoystick();
});
joystickCanvas.addEventListener('touchstart', ev => {
  joystick.active = true;
  updateJoystickFromEvent(ev);
});
joystickCanvas.addEventListener('touchmove', ev => {
  if (joystick.active) { updateJoystickFromEvent(ev); ev.preventDefault(); }
});
joystickCanvas.addEventListener('touchend', ev => {
  joystick.active = false; resetJoystick();
});

// === Shooting Control ===
let canShoot = true;
window.addEventListener('keydown', e => {
  if (e.code === 'Space' && canShoot) {
    shootBullet();
    canShoot = false;
  }
});
window.addEventListener('keyup', e => {
  if (e.code === 'Space') canShoot = true;
});
canvas.addEventListener('pointerdown', e => {
  // Shoot on tap outside joystick area
  const rect = canvas.getBoundingClientRect();
  if (e.clientX-rect.left > 150) shootBullet();
});

// === Shooting ===
function shootBullet() {
  bullets.push({ x: aircraft.x, y: aircraft.y-40, r: 7 });
}

// === Target spawning ===
function spawnTarget() {
  const w = 56, h = 56;
  const x = Math.random()*(CANVAS_W-w) + w/2;
  targets.push({ x: x, y: -h, w: w, h: h, alive: true });
}

// === Game Loop ===
function update(dt) {
  // Aircraft movement
  aircraft.vx = joystick.dx * AIRCRAFT_SPEED;
  aircraft.vy = joystick.dy * AIRCRAFT_SPEED;
  aircraft.x += aircraft.vx;
  aircraft.y += aircraft.vy;
  aircraft.x = Math.max(aircraft.w/2, Math.min(CANVAS_W-aircraft.w/2, aircraft.x));
  aircraft.y = Math.max(aircraft.h/2, Math.min(CANVAS_H-aircraft.h/2, aircraft.y));

  // Bullets
  for (let b of bullets) b.y -= BULLET_SPEED;
  bullets = bullets.filter(b => b.y > -10);

  // Targets
  for (let t of targets) t.y += TARGET_SPEED;
  targets = targets.filter(t => t.y < CANVAS_H+60 && t.alive);

  // Collisions
  for (let t of targets) {
    for (let b of bullets) {
      let dx = t.x - b.x, dy = t.y - b.y;
      if (Math.abs(dx) < t.w/2 && Math.abs(dy) < t.h/2) {
        t.alive = false;
        b.y = -100;
        score++;
      }
    }
  }
}

function render() {
  ctx.clearRect(0,0,CANVAS_W,CANVAS_H);
  // Aircraft
  ctx.save();
  ctx.translate(aircraft.x, aircraft.y);
  ctx.drawImage(imgAircraft, -aircraft.w/2, -aircraft.h/2, aircraft.w, aircraft.h);
  ctx.restore();

  // Bullets
  ctx.fillStyle = '#ff0';
  for (let b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fill();
  }

  // Targets
  for (let t of targets) {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.drawImage(imgTarget, -t.w/2, -t.h/2, t.w, t.h);
    ctx.restore();
  }

  // Score
  ctx.font = "28px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText("Score: "+score, 16, 40);
}

let lastFrame = performance.now();
function gameLoop(ts) {
  let dt = ts - lastFrame;
  lastFrame = ts;
  update(dt);

  // Spawn targets
  if (performance.now() - lastTargetSpawn > TARGET_SPAWN_INTERVAL) {
    spawnTarget();
    lastTargetSpawn = performance.now();
  }

  render();
  requestAnimationFrame(gameLoop);
}

// === Start Game when images loaded ===
let imagesLoaded = 0;
function checkReady() {
  imagesLoaded++;
  if (imagesLoaded === 3) {
    drawJoystick();
    requestAnimationFrame(gameLoop);
  }
}
imgAircraft.onload = checkReady;
imgAnalog.onload = checkReady;
imgTarget.onload = checkReady;