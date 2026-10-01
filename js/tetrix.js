const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextContext = nextCanvas.getContext('2d');

context.scale(24, 24); // 240/10 = 24
nextContext.scale(20, 20); // 80/4 = 20

function arenaSweep() {
    let rowCount = 1;
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
        rowCount *= 2;
        
        // Level up every 5 lines
        player.level = Math.floor(player.lines / 5) + 1;
        dropInterval = Math.max(100, 1000 - (player.level - 1) * 100);
    }
}

function collide(arena, player) {
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

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'T') {
        return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
    } else if (type === 'O') {
        return [
            [2, 2],
            [2, 2],
        ];
    } else if (type === 'L') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ];
    } else if (type === 'J') {
        return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ];
    } else if (type === 'I') {
        return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'Z') {
        return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ];
    }
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, {x: 0, y: 0}, context);
    drawMatrix(player.matrix, player.pos, context);
    
    // Draw Next Piece
    nextContext.fillStyle = '#111';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if(nextPiece) {
        // Center the next piece
        const offsetX = (4 - nextPiece[0].length) / 2;
        const offsetY = (4 - nextPiece.length) / 2;
        drawMatrix(nextPiece, {x: offsetX, y: offsetY}, nextContext);
    }
}

const colors = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // O
    '#0DFF72', // L
    '#F538FF', // J
    '#FF8E0D', // I
    '#FFE138', // S
    '#3877FF'  // Z
];

function drawMatrix(matrix, offset, ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x,
                             y + offset.y,
                             1, 1);
                // Grid effect
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                ctx.lineWidth = 0.05;
                ctx.strokeStyle = '#fff';
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
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
    if(!nextPiece) nextPiece = getRandomPiece();
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
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isGameOver = false;

function update(time = 0) {
    if(isGameOver) return;
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

const arena = createMatrix(10, 20);
const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    lines: 0,
    level: 1
};

document.addEventListener('keydown', event => {
    if(isGameOver) return;
    if (event.keyCode === 37) {
        playerMove(-1);
    } else if (event.keyCode === 39) {
        playerMove(1);
    } else if (event.keyCode === 40) {
        playerDrop();
    } else if (event.keyCode === 38) {
        playerRotate(1);
    }
});

// Mobile Controls
document.getElementById('btn-left').addEventListener('touchstart', (e) => { e.preventDefault(); playerMove(-1); });
document.getElementById('btn-right').addEventListener('touchstart', (e) => { e.preventDefault(); playerMove(1); });
document.getElementById('btn-down').addEventListener('touchstart', (e) => { e.preventDefault(); playerDrop(); });
document.getElementById('btn-rotate').addEventListener('touchstart', (e) => { e.preventDefault(); playerRotate(1); });

document.getElementById('btn-restart').addEventListener('click', () => {
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    dropInterval = 1000;
    updateScore();
    isGameOver = false;
    document.getElementById('game-over-overlay').classList.add('hidden');
    playerReset();
    update();
});

playerReset();
updateScore();
update();
