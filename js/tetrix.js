/**
 * 🕹️ THE KING TETRIX — Motor del Juego v4
 * ⚡ Canvas responsivo, swipe táctil, emojis a todo color
 */

// ===== PANTALLA DE BIENVENIDA =====
const welcomeScreen = document.getElementById('welcome-screen');
const gameZone = document.getElementById('game-zone');
const btnStartGame = document.getElementById('btn-start-game');
let gameStarted = false;

btnStartGame.addEventListener('click', () => {
    welcomeScreen.style.display = 'none';
    gameZone.style.display = 'flex';
    gameStarted = true;
    setupCanvas();     // Escalar canvas antes de empezar
    playerReset();
    updateScore();
    update();
});

// ===== SETUP DEL CANVAS RESPONSIVO =====
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextContext = nextCanvas.getContext('2d');

// Dimensiones lógicas fijas del tablero
const COLS = 10;
const ROWS = 20;
let CELL = 24; // se recalcula

function setupCanvas() {
    // Calculamos cuánto espacio hay disponible
    const container = document.querySelector('.canvas-wrapper');
    const parent = document.querySelector('.game-area');
    
    // Espacio vertical disponible (descontamos header + stats + controles)
    const vh = window.innerHeight;
    const availH = vh - 160; // reservamos ~160px para header+stats+controles+márgenes
    const availW = Math.min(window.innerWidth * 0.65, 300); // max 65% del ancho

    // Celda = mínimo entre lo que entra en alto y en ancho
    CELL = Math.floor(Math.min(availH / ROWS, availW / COLS));
    CELL = Math.max(CELL, 18); // mínimo 18px por celda

    const W = COLS * CELL;
    const H = ROWS * CELL;

    canvas.width = W;
    canvas.height = H;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';

    // Next piece canvas: 4x4 celdas
    const NC = Math.floor(CELL * 0.85);
    nextCanvas.width  = 4 * NC;
    nextCanvas.height = 4 * NC;
    nextCanvas.style.width  = 4 * NC + 'px';
    nextCanvas.style.height = 4 * NC + 'px';

    context.scale(CELL, CELL);
    nextContext.scale(NC, NC);
}

// ===== ARSENAL DE EMOJIS (30 iconos para máxima diversión) =====
const foodEmojis = [
    null,
    // 🍔 Comida TheKing
    '🍔', '🍕', '🍟', '🌭', '🧀', '🥓', '🥩', '🍗', '🌮', '🌯', '🥪',
    // 👑 Realeza
    '👑', '🤴', '👸', '🏰', '💎', '⚔️', '🛡️',
    // 🍅 Frutas y verduras
    '🍅', '🥑', '🌶️', '🌽', '🍄', '🥬',
    // 🍦 Dulces
    '🍦', '🍩', '🍪', '🎂', '🧁', '🍫'
];

// ===== FUNCIONES CORE =====
function createMatrix(w, h) {
    const matrix = [];
    while (h--) matrix.push(new Array(w).fill(0));
    return matrix;
}

function createPiece(type) {
    // Plantillas de forma (valores temporales, se reemplazan abajo)
    const templates = {
        'T': [[0,0,0],[1,1,1],[0,1,0]],
        'O': [[1,1],[1,1]],
        'L': [[0,1,0],[0,1,0],[0,1,1]],
        'J': [[0,1,0],[0,1,0],[1,1,0]],
        'I': [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
        'S': [[0,1,1],[1,1,0],[0,0,0]],
        'Z': [[1,1,0],[0,1,1],[0,0,0]]
    };
    
    // Clonar la plantilla (importante para no mutar el original)
    const template = templates[type];
    const p = template.map(row => [...row]);
    
    // Emoji aleatorio del arsenal, único por pieza
    const randomId = Math.floor(Math.random() * (foodEmojis.length - 1)) + 1;
    
    for (let y = 0; y < p.length; y++) {
        for (let x = 0; x < p[y].length; x++) {
            if (p[y][x] !== 0) p[y][x] = randomId;
        }
    }
    return p;
}

function drawMatrix(matrix, offset, ctx, cellSize) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const px = x + offset.x;
                const py = y + offset.y;
                
                // Emoji a todo color sin fondo oscuro
                ctx.font = `${cellSize * 0.78}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    foodEmojis[value],
                    px + 0.5,
                    py + 0.55
                );
                
                // Borde sutil para separar bloques
                ctx.lineWidth = 0.05;
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.strokeRect(px, py, 1, 1);
            }
        });
    });
}

function draw() {
    // Fondo oscuro
    context.fillStyle = '#0a0a12';
    context.fillRect(0, 0, COLS, ROWS);
    
    // Grid sutil
    context.strokeStyle = 'rgba(255,255,255,0.04)';
    context.lineWidth = 0.02;
    for (let x = 0; x <= COLS; x++) {
        context.beginPath(); context.moveTo(x, 0); context.lineTo(x, ROWS); context.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        context.beginPath(); context.moveTo(0, y); context.lineTo(COLS, y); context.stroke();
    }
    
    drawMatrix(arena, {x:0, y:0}, context, 1);
    
    if (!isGameOver && !isPaused) drawGhost();
    
    drawMatrix(player.matrix, player.pos, context, 1);
    
    // Next piece
    const NC_scale = nextCanvas.width / 4;
    nextContext.fillStyle = '#0a0a12';
    nextContext.fillRect(0, 0, 4, 4);
    if (nextPiece) {
        const ox = (4 - nextPiece[0].length) / 2;
        const oy = (4 - nextPiece.length) / 2;
        drawMatrix(nextPiece, {x: ox, y: oy}, nextContext, 1);
    }
}

// ===== GHOST PIECE =====
function drawGhost() {
    const ghost = { pos: {x: player.pos.x, y: player.pos.y}, matrix: player.matrix };
    while (!collideCheck(arena, ghost)) ghost.pos.y++;
    ghost.pos.y--;
    ghost.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = 'rgba(255,255,255,0.06)';
                context.fillRect(x + ghost.pos.x, y + ghost.pos.y, 1, 1);
                context.strokeStyle = 'rgba(255,255,255,0.12)';
                context.lineWidth = 0.05;
                context.strokeRect(x + ghost.pos.x, y + ghost.pos.y, 1, 1);
            }
        });
    });
}

function collideCheck(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function collide(arena, player) { return collideCheck(arena, player); }

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
        });
    });
}

function arenaSweep() {
    let rowCount = 1, linesCleared = 0;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) continue outer;
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += rowCount * 10;
        player.lines += 1;
        linesCleared++;
        rowCount *= 2;
    }
    player.level = Math.floor(player.lines / 5) + 1;
    dropInterval = Math.max(80, 1000 - (player.level - 1) * 100);
    if (linesCleared > 0) flashEffect();
}

function flashEffect() {
    const container = document.querySelector('.canvas-container');
    container.style.boxShadow = '0 0 40px rgba(0, 243, 255, 0.8), inset 0 0 20px rgba(0, 243, 255, 0.3)';
    setTimeout(() => {
        container.style.boxShadow = '0 0 25px rgba(255, 0, 234, 0.4), inset 0 0 15px rgba(255, 0, 234, 0.1)';
    }, 200);
}

// ===== MOVIMIENTO =====
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerHardDrop() {
    while (!collide(arena, player)) player.pos.y++;
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) player.pos.x -= dir;
}

function getRandomPiece() {
    const pieces = 'ILJOTSZ';
    return createPiece(pieces[pieces.length * Math.random() | 0]);
}

let nextPiece = null;

function playerReset() {
    if (!nextPiece) nextPiece = getRandomPiece();
    player.matrix = nextPiece;
    nextPiece = getRandomPiece();
    player.pos.y = 0;
    player.pos.x = (COLS / 2 | 0) - (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        document.getElementById('game-over-overlay').classList.remove('hidden');
        document.getElementById('final-score').innerText = player.score;
        isGameOver = true;
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
}

// ===== GAME LOOP =====
let dropCounter = 0, dropInterval = 1000, lastTime = 0;
let isGameOver = false, isPaused = false;

function update(time = 0) {
    if (isGameOver) return;
    if (isPaused) { requestAnimationFrame(update); return; }
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) playerDrop();
    draw();
    requestAnimationFrame(update);
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
    document.getElementById('lines').innerText = player.lines;
    document.getElementById('level').innerText = player.level;
}

// ===== PAUSA =====
function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    const overlay = document.getElementById('pause-overlay');
    if (isPaused) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
        lastTime = performance.now();
        dropCounter = 0;
    }
}

// ===== ARENA & PLAYER =====
const arena = createMatrix(COLS, ROWS);
const player = { pos: {x:0, y:0}, matrix: null, score: 0, lines: 0, level: 1 };

// ===== CONTROLES DE TECLADO =====
document.addEventListener('keydown', event => {
    if (!gameStarted || isGameOver) return;
    if (event.key === 'p' || event.key === 'P') { togglePause(); return; }
    if (isPaused) return;
    if (event.keyCode === 37) playerMove(-1);
    else if (event.keyCode === 39) playerMove(1);
    else if (event.keyCode === 40) playerDrop();
    else if (event.keyCode === 38) playerRotate(1);
    else if (event.keyCode === 32) { event.preventDefault(); playerHardDrop(); }
});

// ===== CONTROLES BOTONES (touch + click) =====
function addControl(id, fn) {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); if (!isPaused && !isGameOver) fn(); }, {passive: false});
    el.addEventListener('click', () => { if (!isPaused && !isGameOver) fn(); });
}

addControl('btn-left',   () => playerMove(-1));
addControl('btn-right',  () => playerMove(1));
addControl('btn-down',   () => playerDrop());
addControl('btn-rotate', () => playerRotate(1));

// ===== SWIPE TÁCTIL EN EL CANVAS =====
let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
const SWIPE_THRESHOLD = 20;   // px para considerar un swipe
const TAP_THRESHOLD   = 10;   // px de movimiento para considerar tap
const TAP_TIME        = 220;  // ms máximo para un tap

const touchZone = document.getElementById('canvas-touch-zone');

touchZone.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStartX    = t.clientX;
    touchStartY    = t.clientY;
    touchStartTime = Date.now();
    e.preventDefault();
}, {passive: false});

touchZone.addEventListener('touchend', (e) => {
    if (!gameStarted || isGameOver || isPaused) return;
    const t  = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx < TAP_THRESHOLD && absDy < TAP_THRESHOLD && dt < TAP_TIME) {
        // Tap → rotar
        playerRotate(1);
    } else if (absDx > absDy && absDx > SWIPE_THRESHOLD) {
        // Swipe horizontal → mover
        playerMove(dx > 0 ? 1 : -1);
    } else if (absDy > absDx && dy > SWIPE_THRESHOLD) {
        // Swipe hacia abajo → hard drop
        playerHardDrop();
    } else if (absDy > absDx && dy < -SWIPE_THRESHOLD) {
        // Swipe hacia arriba → pausa
        togglePause();
    }
    e.preventDefault();
}, {passive: false});

// Swipe contínuo (arrastrando) → movimiento fluido
touchZone.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, {passive: false});

// ===== UI BUTTONS =====
document.getElementById('btn-pause').addEventListener('click',  () => togglePause());
document.getElementById('btn-resume').addEventListener('click', () => togglePause());

document.getElementById('btn-restart').addEventListener('click', () => {
    player.score = 0; player.lines = 0; player.level = 1;
    dropInterval = 1000;
    updateScore();
    isGameOver = false;
    document.getElementById('game-over-overlay').classList.add('hidden');
    playerReset();
    lastTime = performance.now();
    dropCounter = 0;
    update();
});
