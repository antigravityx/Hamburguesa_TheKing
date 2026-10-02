/**
 * 🕹️ THE KING TETRIX — Motor del Juego v2
 * Con pantalla de bienvenida, pausa y controles mejorados
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
    playerReset();
    updateScore();
    update();
});

// ===== SETUP DEL CANVAS =====
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextContext = nextCanvas.getContext('2d');

context.scale(24, 24); // 240/10 = 24
nextContext.scale(20, 20); // 80/4 = 20

// ===== COLORES NEON =====
const colors = [
    null,
    '#FF0D72', // T - Rosa
    '#0DC2FF', // O - Azul
    '#0DFF72', // L - Verde
    '#F538FF', // J - Púrpura
    '#FF8E0D', // I - Naranja
    '#FFE138', // S - Amarillo
    '#3877FF'  // Z - Azul profundo
];

const foodEmojis = [
    null,
    // Comida rápida y carnivora
    '🍔', '🍕', '🍟', '🌭', '🧀', '🥓', '🥩', '🍗', '🌮', '🌯', '🥪', '🥨',
    // Realeza TheKing
    '👑', '🤴', '👸', '🏰', '💎', '🛡️', '⚔️',
    // Frutas y verduras (para el blend)
    '🍅', '🥑', '🥒', '🧅', '🍄', '🌶️', '🌽', '🥬',
    // Dulces y bebidas
    '🥤', '🍹', '🍦', '🍩', '🍪'
];

// ===== FUNCIONES CORE =====

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    const pieces = {
        'T': [[0,0,0],[1,1,1],[0,1,0]],
        'O': [[2,2],[2,2]],
        'L': [[0,3,0],[0,3,0],[0,3,3]],
        'J': [[0,4,0],[0,4,0],[4,4,0]],
        'I': [[0,5,0,0],[0,5,0,0],[0,5,0,0],[0,5,0,0]],
        'S': [[0,6,6],[6,6,0],[0,0,0]],
        'Z': [[7,7,0],[0,7,7],[0,0,0]]
    };
    
    const p = pieces[type];
    // Elegir un emoji aleatorio del inmenso arsenal
    const randomId = Math.floor(Math.random() * (foodEmojis.length - 1)) + 1;
    
    for (let y = 0; y < p.length; y++) {
        for (let x = 0; x < p[y].length; x++) {
            if (p[y][x] !== 0) {
                p[y][x] = randomId;
            }
        }
    }
    return p;
}

function drawMatrix(matrix, offset, ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // Fondo oscuro opcional para resaltar el bloque
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                
                // Dibujar el emoji
                ctx.font = '0.8px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(foodEmojis[value], x + offset.x + 0.5, y + offset.y + 0.55);
                
                // Borde exterior muy sutil
                ctx.lineWidth = 0.04;
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    // Fondo con patrón grid sutil
    context.fillStyle = '#0a0a12';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid lines sutiles
    context.strokeStyle = 'rgba(255,255,255,0.03)';
    context.lineWidth = 0.02;
    for (let x = 0; x < 10; x++) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, 20);
        context.stroke();
    }
    for (let y = 0; y < 20; y++) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(10, y);
        context.stroke();
    }
    
    drawMatrix(arena, {x: 0, y: 0}, context);
    
    // Ghost piece (sombra de donde va a caer)
    if (!isGameOver && !isPaused) {
        drawGhost();
    }
    
    drawMatrix(player.matrix, player.pos, context);
    
    // Next Piece
    nextContext.fillStyle = '#0a0a12';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        const offsetX = (4 - nextPiece[0].length) / 2;
        const offsetY = (4 - nextPiece.length) / 2;
        drawMatrix(nextPiece, {x: offsetX, y: offsetY}, nextContext);
    }
}

// ===== GHOST PIECE (preview de dónde cae) =====
function drawGhost() {
    const ghost = {
        pos: { x: player.pos.x, y: player.pos.y },
        matrix: player.matrix
    };
    
    while (!collideCheck(arena, ghost)) {
        ghost.pos.y++;
    }
    ghost.pos.y--;
    
    // Dibujar ghost semi-transparente
    ghost.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = 'rgba(255,255,255,0.08)';
                context.fillRect(x + ghost.pos.x, y + ghost.pos.y, 1, 1);
                context.strokeStyle = 'rgba(255,255,255,0.15)';
                context.lineWidth = 0.04;
                context.strokeRect(x + ghost.pos.x, y + ghost.pos.y, 1, 1);
            }
        });
    });
}

function collideCheck(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function collide(arena, player) {
    return collideCheck(arena, player);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function arenaSweep() {
    let rowCount = 1;
    let linesCleared = 0;
    
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += rowCount * 10;
        player.lines += 1;
        linesCleared++;
        rowCount *= 2;
    }
    
    // Level up cada 5 líneas
    player.level = Math.floor(player.lines / 5) + 1;
    dropInterval = Math.max(80, 1000 - (player.level - 1) * 100);
    
    // Flash effect on line clear
    if (linesCleared > 0) {
        flashEffect();
    }
}

function flashEffect() {
    const container = document.querySelector('.canvas-container');
    container.style.boxShadow = '0 0 40px rgba(0, 243, 255, 0.8), inset 0 0 20px rgba(0, 243, 255, 0.3)';
    setTimeout(() => {
        container.style.boxShadow = '0 0 25px rgba(255, 0, 234, 0.4), inset 0 0 15px rgba(255, 0, 234, 0.1)';
    }, 200);
}

// ===== MOVIMIENTO DEL JUGADOR =====

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
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
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
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    
    if (collide(arena, player)) {
        // Game Over
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
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// ===== GAME LOOP =====

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isGameOver = false;
let isPaused = false;

function update(time = 0) {
    if (isGameOver) return;
    if (isPaused) {
        requestAnimationFrame(update);
        return;
    }
    
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    
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
    const pauseOverlay = document.getElementById('pause-overlay');
    if (isPaused) {
        pauseOverlay.classList.remove('hidden');
    } else {
        pauseOverlay.classList.add('hidden');
        lastTime = performance.now();
        dropCounter = 0;
    }
}

// ===== ARENA & PLAYER =====
const arena = createMatrix(10, 20);
const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    lines: 0,
    level: 1
};

// ===== CONTROLES DE TECLADO =====
document.addEventListener('keydown', event => {
    if (!gameStarted || isGameOver) return;
    
    if (event.key === 'p' || event.key === 'P') {
        togglePause();
        return;
    }
    
    if (isPaused) return;
    
    if (event.keyCode === 37) {          // Izquierda
        playerMove(-1);
    } else if (event.keyCode === 39) {   // Derecha
        playerMove(1);
    } else if (event.keyCode === 40) {   // Abajo
        playerDrop();
    } else if (event.keyCode === 38) {   // Arriba (rotar)
        playerRotate(1);
    } else if (event.keyCode === 32) {   // Espacio (hard drop)
        playerHardDrop();
    }
});

// ===== CONTROLES MÓVILES =====
document.getElementById('btn-left').addEventListener('touchstart', (e) => { e.preventDefault(); if (!isPaused) playerMove(-1); });
document.getElementById('btn-right').addEventListener('touchstart', (e) => { e.preventDefault(); if (!isPaused) playerMove(1); });
document.getElementById('btn-down').addEventListener('touchstart', (e) => { e.preventDefault(); if (!isPaused) playerDrop(); });
document.getElementById('btn-rotate').addEventListener('touchstart', (e) => { e.preventDefault(); if (!isPaused) playerRotate(1); });

// Fallback click para escritorio
document.getElementById('btn-left').addEventListener('click', () => { if (!isPaused) playerMove(-1); });
document.getElementById('btn-right').addEventListener('click', () => { if (!isPaused) playerMove(1); });
document.getElementById('btn-down').addEventListener('click', () => { if (!isPaused) playerDrop(); });
document.getElementById('btn-rotate').addEventListener('click', () => { if (!isPaused) playerRotate(1); });

// ===== BOTONES DE UI =====
document.getElementById('btn-pause').addEventListener('click', () => togglePause());
document.getElementById('btn-resume').addEventListener('click', () => togglePause());

document.getElementById('btn-restart').addEventListener('click', () => {
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    dropInterval = 1000;
    updateScore();
    isGameOver = false;
    document.getElementById('game-over-overlay').classList.add('hidden');
    playerReset();
    lastTime = performance.now();
    dropCounter = 0;
    update();
});
