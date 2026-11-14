// ⚔️ COLISEO DEL REY — Sala de Espera 1v1 | The King Burger
// Versión 1.0 | Micro-Etapa 3 del Reino The King
// R1CH0N · VERIX · ARKH — LA TRINIDAD

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════
  //  CONSTANTES Y ESTADO
  // ═══════════════════════════════════════════════════════════

  const COLISEO_VERSION = '1.0.0';
  const CORONAS_POR_VICTORIA = 5;
  const MATCHMAKING_TIMEOUT_MS = 7000;
  const TETRIX_DURATION_S = 60;
  const STACKER_MAX_NIVELES = 10;

  let coliseoState = {
    juegoActivo: null,       // 'tetrix' | 'stacker'
    oponente: null,          // { nombre, esBot }
    tetrixInterval: null,
    tetrixTimeLeft: TETRIX_DURATION_S,
    tetrixBoard: [],
    tetrixPiezaActual: null,
    tetrixPiezaX: 0,
    tetrixPiezaY: 0,
    tetrixLineas: 0,
    stackerNivel: 0,
    stackerVidas: 3,
    stackerBarraPosX: 0,
    stackerDir: 1,
    stackerSpeed: 2,
    stackerInterval: null,
    matchmakingTimer: null,
    coronasGanadas: 0,
    resultadoFinal: null,
  };

  // ═══════════════════════════════════════════════════════════
  //  INYECCIÓN DEL HTML DEL MODAL COLISEO
  // ═══════════════════════════════════════════════════════════

  function inyectarModalColiseo() {
    if (document.getElementById('modal-coliseo')) return;

    const modalHTML = `
<div id="modal-coliseo" style="display:none;position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.92);overflow-y:auto;">
  <div id="coliseo-container" style="max-width:420px;margin:20px auto;padding:16px;font-family:'Segoe UI',sans-serif;">

    <!-- HEADER COLISEO -->
    <div style="text-align:center;margin-bottom:12px;">
      <div style="font-size:2em;margin-bottom:4px;">⚔️</div>
      <h2 style="color:#FFD700;margin:0;font-size:1.3em;text-transform:uppercase;letter-spacing:2px;">Coliseo del Rey</h2>
      <p id="coliseo-estado-pedido" style="color:#aaa;font-size:0.82em;margin:6px 0 0;">
        🥩 En Parrilla a Carbón &nbsp;|&nbsp; 🛵 Cadete en Alistamiento &nbsp;|&nbsp; ⏳ ~20 min
      </p>
    </div>

    <!-- BARRA DE CORONAS -->
    <div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-bottom:14px;">
      <span style="color:#FFD700;font-size:0.9em;">👑 Coronas ganadas hoy:</span>
      <span id="coliseo-coronas-counter" style="color:#FFD700;font-weight:bold;font-size:1.1em;">0</span>
    </div>

    <!-- SELECTOR DE JUEGO (pantalla inicial) -->
    <div id="coliseo-selector" style="text-align:center;">
      <p style="color:#ccc;font-size:0.9em;margin-bottom:16px;">¿A qué querés jugar mientras esperás tu burger?</p>

      <button id="btn-elegir-tetrix" style="
        display:block;width:100%;padding:14px 10px;margin-bottom:12px;
        background:linear-gradient(135deg,#1a1a2e,#16213e);
        border:2px solid #FFD700;border-radius:12px;cursor:pointer;
        color:#fff;font-size:1em;text-align:left;">
        🧱 <strong>Tetrix de la Corona</strong>
        <br><span style="font-size:0.78em;color:#aaa;">60 segundos de batalla • Más líneas = más coronas</span>
      </button>

      <button id="btn-elegir-stacker" style="
        display:block;width:100%;padding:14px 10px;margin-bottom:16px;
        background:linear-gradient(135deg,#1a1a2e,#16213e);
        border:2px solid #FF6B35;border-radius:12px;cursor:pointer;
        color:#fff;font-size:1em;text-align:left;">
        🍔 <strong>Stacker del Rey</strong>
        <br><span style="font-size:0.78em;color:#aaa;">Apilá burgers perfectas • Sin caídas hasta la cima</span>
      </button>

      <button id="btn-cerrar-coliseo-inicio" style="
        background:transparent;border:1px solid #555;border-radius:8px;
        color:#888;padding:8px 20px;cursor:pointer;font-size:0.85em;">
        Ahora no, gracias
      </button>
    </div>

    <!-- MATCHMAKING -->
    <div id="coliseo-matchmaking" style="display:none;text-align:center;padding:20px 0;">
      <div style="font-size:2.5em;animation:spin 1.2s linear infinite;display:inline-block;">⚔️</div>
      <p style="color:#FFD700;font-size:1em;margin-top:12px;">Buscando rival en Corrientes...</p>
      <p style="color:#888;font-size:0.82em;" id="coliseo-matchmaking-sub">Si no encontramos a nadie, jugás contra el Caballero del Rey 🤖</p>
      <div id="coliseo-match-barra" style="
        height:4px;background:#333;border-radius:2px;margin-top:16px;overflow:hidden;">
        <div id="coliseo-match-progreso" style="
          height:100%;background:#FFD700;width:0%;
          transition:width 0.1s linear;"></div>
      </div>
    </div>

    <!-- ARENA TETRIX -->
    <div id="coliseo-arena-tetrix" style="display:none;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="color:#ccc;font-size:0.85em;">vs <strong id="tetrix-oponente-nombre" style="color:#FFD700;">?</strong></span>
        <span style="color:#fff;font-size:0.9em;">⏱️ <strong id="tetrix-timer">60</strong>s</span>
        <span style="color:#ccc;font-size:0.85em;">Líneas: <strong id="tetrix-lineas" style="color:#0f0;">0</strong></span>
      </div>
      <canvas id="tetrix-canvas" width="210" height="420"
        style="display:block;margin:0 auto;border:2px solid #FFD700;border-radius:4px;background:#000;"></canvas>
      <div style="text-align:center;margin-top:8px;">
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">
          <button class="tetrix-btn" data-action="left"  style="padding:10px 18px;font-size:1.2em;background:#1a1a2e;border:1px solid #555;color:#fff;border-radius:8px;cursor:pointer;">◀</button>
          <button class="tetrix-btn" data-action="rotate" style="padding:10px 18px;font-size:1.2em;background:#1a1a2e;border:1px solid #555;color:#fff;border-radius:8px;cursor:pointer;">🔄</button>
          <button class="tetrix-btn" data-action="right" style="padding:10px 18px;font-size:1.2em;background:#1a1a2e;border:1px solid #555;color:#fff;border-radius:8px;cursor:pointer;">▶</button>
          <button class="tetrix-btn" data-action="down"  style="padding:10px 20px;font-size:1.2em;background:#1a1a2e;border:1px solid #555;color:#fff;border-radius:8px;cursor:pointer;">▼</button>
        </div>
      </div>
    </div>

    <!-- ARENA STACKER -->
    <div id="coliseo-arena-stacker" style="display:none;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="color:#ccc;font-size:0.85em;">vs <strong id="stacker-oponente-nombre" style="color:#FF6B35;">?</strong></span>
        <span style="color:#fff;font-size:0.9em;">❤️ <strong id="stacker-vidas">3</strong></span>
        <span style="color:#ccc;font-size:0.85em;">Nivel: <strong id="stacker-nivel" style="color:#FF6B35;">1</strong></span>
      </div>
      <canvas id="stacker-canvas" width="210" height="420"
        style="display:block;margin:0 auto;border:2px solid #FF6B35;border-radius:4px;background:#111;"></canvas>
      <div style="text-align:center;margin-top:12px;">
        <button id="stacker-btn-colocar" style="
          padding:14px 40px;font-size:1.1em;font-weight:bold;
          background:linear-gradient(135deg,#FF6B35,#c94a1b);
          border:none;border-radius:12px;color:#fff;cursor:pointer;
          box-shadow:0 4px 15px rgba(255,107,53,0.5);">
          🍔 ¡APILAR!
        </button>
      </div>
    </div>

    <!-- RESULTADO FINAL -->
    <div id="coliseo-resultado" style="display:none;text-align:center;padding:20px 0;">
      <div id="coliseo-resultado-emoji" style="font-size:3em;"></div>
      <h3 id="coliseo-resultado-titulo" style="color:#FFD700;font-size:1.3em;margin:8px 0;"></h3>
      <p id="coliseo-resultado-desc" style="color:#ccc;font-size:0.9em;"></p>
      <div id="coliseo-coronas-ganadas-box" style="
        margin:12px auto;padding:10px 20px;
        background:rgba(255,215,0,0.15);border:1px solid #FFD700;
        border-radius:10px;display:inline-block;">
        <span style="color:#FFD700;font-size:1.1em;font-weight:bold;" id="coliseo-resultado-coronas"></span>
      </div>
      <br><br>
      <button id="btn-revancha" style="
        padding:12px 24px;margin-right:10px;font-size:0.95em;
        background:#FFD700;border:none;border-radius:10px;
        color:#000;font-weight:bold;cursor:pointer;">
        ⚔️ Revancha
      </button>
      <button id="btn-cerrar-coliseo-resultado" style="
        padding:12px 20px;font-size:0.95em;
        background:transparent;border:1px solid #555;border-radius:10px;
        color:#888;cursor:pointer;">
        Volver
      </button>
    </div>

  </div>
</div>

<!-- BANNER FLOTANTE POST-PEDIDO -->
<div id="coliseo-banner" style="display:none;position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
  z-index:8900;width:calc(100% - 32px);max-width:400px;
  background:linear-gradient(135deg,#1a1a2e,#16213e);
  border:2px solid #FFD700;border-radius:14px;padding:14px 16px;
  box-shadow:0 8px 30px rgba(255,215,0,0.3);">
  <div style="display:flex;align-items:center;gap:10px;">
    <span style="font-size:1.8em;">🍔</span>
    <div style="flex:1;">
      <div style="color:#FFD700;font-weight:bold;font-size:0.9em;">¡Tu pedido está en marcha!</div>
      <div style="color:#ccc;font-size:0.8em;">¿Te animás a un duelo en el Coliseo mientras esperás?</div>
    </div>
    <button id="btn-banner-cerrar" style="
      background:transparent;border:none;color:#555;font-size:1.2em;cursor:pointer;
      align-self:flex-start;">✕</button>
  </div>
  <button id="btn-banner-entrar" style="
    display:block;width:100%;margin-top:10px;padding:10px;
    background:linear-gradient(135deg,#FFD700,#c9a900);
    border:none;border-radius:10px;color:#000;font-weight:bold;
    font-size:0.95em;cursor:pointer;letter-spacing:0.5px;">
    ⚔️ Entrar al Coliseo
  </button>
</div>

<style>
@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
@keyframes coliseo-entrada { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
#coliseo-container { animation: coliseo-entrada 0.3s ease; }
.tetrix-btn:active { opacity: 0.7; transform: scale(0.95); }
</style>
`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    bindColiseoEvents();
  }

  // ═══════════════════════════════════════════════════════════
  //  EVENT BINDINGS
  // ═══════════════════════════════════════════════════════════

  function bindColiseoEvents() {
    // Selector de juego
    document.getElementById('btn-elegir-tetrix').addEventListener('click', () => iniciarMatchmaking('tetrix'));
    document.getElementById('btn-elegir-stacker').addEventListener('click', () => iniciarMatchmaking('stacker'));
    document.getElementById('btn-cerrar-coliseo-inicio').addEventListener('click', cerrarColiseo);

    // Banner post-pedido
    document.getElementById('btn-banner-entrar').addEventListener('click', abrirColiseo);
    document.getElementById('btn-banner-cerrar').addEventListener('click', () => {
      document.getElementById('coliseo-banner').style.display = 'none';
    });

    // Resultado
    document.getElementById('btn-revancha').addEventListener('click', () => {
      mostrarPantalla('selector');
    });
    document.getElementById('btn-cerrar-coliseo-resultado').addEventListener('click', cerrarColiseo);

    // Botones de Tetrix
    document.querySelectorAll('.tetrix-btn').forEach(btn => {
      btn.addEventListener('click', () => tetrixAccion(btn.dataset.action));
    });

    // Botón Stacker
    document.getElementById('stacker-btn-colocar').addEventListener('click', stackerColocar);

    // Teclado (desktop)
    document.addEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (!document.getElementById('modal-coliseo') || document.getElementById('modal-coliseo').style.display === 'none') return;
    if (coliseoState.juegoActivo === 'tetrix') {
      if (e.key === 'ArrowLeft')  tetrixAccion('left');
      if (e.key === 'ArrowRight') tetrixAccion('right');
      if (e.key === 'ArrowDown')  tetrixAccion('down');
      if (e.key === 'ArrowUp')    tetrixAccion('rotate');
    }
    if (coliseoState.juegoActivo === 'stacker') {
      if (e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); stackerColocar(); }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  CONTROL DE PANTALLAS
  // ═══════════════════════════════════════════════════════════

  function mostrarPantalla(pantalla) {
    const paneles = ['coliseo-selector','coliseo-matchmaking','coliseo-arena-tetrix','coliseo-arena-stacker','coliseo-resultado'];
    paneles.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const target = {
      selector:   'coliseo-selector',
      matchmaking:'coliseo-matchmaking',
      tetrix:     'coliseo-arena-tetrix',
      stacker:    'coliseo-arena-stacker',
      resultado:  'coliseo-resultado',
    }[pantalla];
    if (target) {
      const el = document.getElementById(target);
      if (el) el.style.display = 'block';
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  ABRIR / CERRAR COLISEO
  // ═══════════════════════════════════════════════════════════

  function abrirColiseo() {
    document.getElementById('coliseo-banner').style.display = 'none';
    document.getElementById('modal-coliseo').style.display = 'block';
    mostrarPantalla('selector');
    detenerJuegos();
    coliseoState.juegoActivo = null;
    coliseoState.resultadoFinal = null;
  }

  function cerrarColiseo() {
    document.getElementById('modal-coliseo').style.display = 'none';
    detenerJuegos();
  }

  function detenerJuegos() {
    if (coliseoState.tetrixInterval) { clearInterval(coliseoState.tetrixInterval); coliseoState.tetrixInterval = null; }
    if (coliseoState.stackerInterval) { clearInterval(coliseoState.stackerInterval); coliseoState.stackerInterval = null; }
    if (coliseoState.matchmakingTimer) { clearTimeout(coliseoState.matchmakingTimer); coliseoState.matchmakingTimer = null; }
  }

  // ═══════════════════════════════════════════════════════════
  //  MATCHMAKING
  // ═══════════════════════════════════════════════════════════

  const BOTS = [
    { nombre: 'Caballero del Rey 🤖', esBot: true },
    { nombre: 'Sir Papas Fritas 🤖', esBot: true },
    { nombre: 'El Barón Doble 🤖', esBot: true },
  ];

  function iniciarMatchmaking(juego) {
    coliseoState.juegoActivo = juego;
    coliseoState.oponente = null;
    mostrarPantalla('matchmaking');

    // Animar barra de progreso
    let progreso = 0;
    const barraEl = document.getElementById('coliseo-match-progreso');
    const barraInt = setInterval(() => {
      progreso = Math.min(progreso + (100 / (MATCHMAKING_TIMEOUT_MS / 100)), 95);
      if (barraEl) barraEl.style.width = progreso + '%';
    }, 100);

    coliseoState.matchmakingTimer = setTimeout(() => {
      clearInterval(barraInt);
      if (barraEl) barraEl.style.width = '100%';
      // Sin rival online → asignar bot
      coliseoState.oponente = BOTS[Math.floor(Math.random() * BOTS.length)];
      setTimeout(() => {
        if (juego === 'tetrix') iniciarTetrix();
        else iniciarStacker();
      }, 400);
    }, MATCHMAKING_TIMEOUT_MS);
  }

  // ═══════════════════════════════════════════════════════════
  //  ══ JUEGO 1: TETRIX DE LA CORONA ══
  // ═══════════════════════════════════════════════════════════

  const TETRIX_COLS = 10;
  const TETRIX_ROWS = 20;
  const TETRIX_CELL = 21; // px
  const TETRIX_COLORES = ['#FFD700','#FF6B35','#E91E8C','#00BCD4','#4CAF50','#9C27B0','#FF5722'];

  const TETRIX_PIEZAS = [
    [[1,1,1,1]],                        // I
    [[1,1],[1,1]],                       // O
    [[0,1,0],[1,1,1]],                   // T
    [[1,0],[1,0],[1,1]],                 // L
    [[0,1],[0,1],[1,1]],                 // J
    [[0,1,1],[1,1,0]],                   // S
    [[1,1,0],[0,1,1]],                   // Z
  ];

  function iniciarTetrix() {
    mostrarPantalla('tetrix');
    document.getElementById('tetrix-oponente-nombre').textContent = coliseoState.oponente.nombre;

    // Reset estado
    coliseoState.tetrixBoard = Array.from({ length: TETRIX_ROWS }, () => Array(TETRIX_COLS).fill(0));
    coliseoState.tetrixLineas = 0;
    coliseoState.tetrixTimeLeft = TETRIX_DURATION_S;
    coliseoState.juegoActivo = 'tetrix';

    tetrixNuevaPieza();
    tetrixDibujar();

    // Timer countdown
    if (coliseoState.tetrixInterval) clearInterval(coliseoState.tetrixInterval);
    coliseoState.tetrixInterval = setInterval(() => {
      coliseoState.tetrixTimeLeft--;
      const timerEl = document.getElementById('tetrix-timer');
      if (timerEl) timerEl.textContent = coliseoState.tetrixTimeLeft;

      // Bajar pieza automáticamente
      tetrixMover(0, 1);

      if (coliseoState.tetrixTimeLeft <= 0) {
        clearInterval(coliseoState.tetrixInterval);
        coliseoState.tetrixInterval = null;
        tetrixFinJuego();
      }
    }, 1000);
  }

  function tetrixNuevaPieza() {
    const idx = Math.floor(Math.random() * TETRIX_PIEZAS.length);
    coliseoState.tetrixPiezaActual = TETRIX_PIEZAS[idx].map(r => [...r]);
    coliseoState.tetrixPiezaColor = TETRIX_COLORES[idx];
    coliseoState.tetrixPiezaX = Math.floor((TETRIX_COLS - coliseoState.tetrixPiezaActual[0].length) / 2);
    coliseoState.tetrixPiezaY = 0;

    // Game over si no cabe
    if (!tetrixPuedeMover(coliseoState.tetrixPiezaActual, coliseoState.tetrixPiezaX, coliseoState.tetrixPiezaY)) {
      clearInterval(coliseoState.tetrixInterval);
      coliseoState.tetrixInterval = null;
      tetrixFinJuego();
    }
  }

  function tetrixPuedeMover(pieza, nx, ny) {
    for (let r = 0; r < pieza.length; r++) {
      for (let c = 0; c < pieza[r].length; c++) {
        if (!pieza[r][c]) continue;
        const newR = ny + r;
        const newC = nx + c;
        if (newR < 0 || newR >= TETRIX_ROWS || newC < 0 || newC >= TETRIX_COLS) return false;
        if (coliseoState.tetrixBoard[newR][newC]) return false;
      }
    }
    return true;
  }

  function tetrixMover(dx, dy) {
    const nx = coliseoState.tetrixPiezaX + dx;
    const ny = coliseoState.tetrixPiezaY + dy;
    if (tetrixPuedeMover(coliseoState.tetrixPiezaActual, nx, ny)) {
      coliseoState.tetrixPiezaX = nx;
      coliseoState.tetrixPiezaY = ny;
      tetrixDibujar();
    } else if (dy > 0) {
      // Fijar pieza
      tetrixFijar();
    }
  }

  function tetrixRotar() {
    const pieza = coliseoState.tetrixPiezaActual;
    const rotada = pieza[0].map((_, ci) => pieza.map(row => row[ci]).reverse());
    if (tetrixPuedeMover(rotada, coliseoState.tetrixPiezaX, coliseoState.tetrixPiezaY)) {
      coliseoState.tetrixPiezaActual = rotada;
      tetrixDibujar();
    }
  }

  function tetrixFijar() {
    const p = coliseoState.tetrixPiezaActual;
    for (let r = 0; r < p.length; r++) {
      for (let c = 0; c < p[r].length; c++) {
        if (p[r][c]) {
          const br = coliseoState.tetrixPiezaY + r;
          const bc = coliseoState.tetrixPiezaX + c;
          if (br >= 0 && br < TETRIX_ROWS) {
            coliseoState.tetrixBoard[br][bc] = coliseoState.tetrixPiezaColor;
          }
        }
      }
    }
    // Eliminar líneas completas
    let lineasEliminadas = 0;
    for (let r = TETRIX_ROWS - 1; r >= 0; r--) {
      if (coliseoState.tetrixBoard[r].every(cell => cell !== 0)) {
        coliseoState.tetrixBoard.splice(r, 1);
        coliseoState.tetrixBoard.unshift(Array(TETRIX_COLS).fill(0));
        lineasEliminadas++;
        r++; // Revisar misma fila de nuevo
      }
    }
    coliseoState.tetrixLineas += lineasEliminadas;
    const lineasEl = document.getElementById('tetrix-lineas');
    if (lineasEl) lineasEl.textContent = coliseoState.tetrixLineas;
    tetrixNuevaPieza();
    tetrixDibujar();
  }

  function tetrixAccion(accion) {
    if (coliseoState.juegoActivo !== 'tetrix') return;
    if (accion === 'left')   tetrixMover(-1, 0);
    if (accion === 'right')  tetrixMover(1, 0);
    if (accion === 'down')   tetrixMover(0, 1);
    if (accion === 'rotate') tetrixRotar();
  }

  function tetrixDibujar() {
    const canvas = document.getElementById('tetrix-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo grilla
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.5;
    for (let r = 0; r < TETRIX_ROWS; r++) {
      for (let c = 0; c < TETRIX_COLS; c++) {
        ctx.strokeRect(c * TETRIX_CELL, r * TETRIX_CELL, TETRIX_CELL, TETRIX_CELL);
      }
    }

    // Tablero fijo
    for (let r = 0; r < TETRIX_ROWS; r++) {
      for (let c = 0; c < TETRIX_COLS; c++) {
        if (coliseoState.tetrixBoard[r][c]) {
          ctx.fillStyle = coliseoState.tetrixBoard[r][c];
          ctx.fillRect(c * TETRIX_CELL + 1, r * TETRIX_CELL + 1, TETRIX_CELL - 2, TETRIX_CELL - 2);
        }
      }
    }

    // Pieza actual
    if (coliseoState.tetrixPiezaActual) {
      ctx.fillStyle = coliseoState.tetrixPiezaColor || '#FFD700';
      const p = coliseoState.tetrixPiezaActual;
      for (let r = 0; r < p.length; r++) {
        for (let c = 0; c < p[r].length; c++) {
          if (p[r][c]) {
            const drawX = (coliseoState.tetrixPiezaX + c) * TETRIX_CELL + 1;
            const drawY = (coliseoState.tetrixPiezaY + r) * TETRIX_CELL + 1;
            ctx.fillRect(drawX, drawY, TETRIX_CELL - 2, TETRIX_CELL - 2);
          }
        }
      }
    }
  }

  function tetrixFinJuego() {
    coliseoState.juegoActivo = null;
    const lineas = coliseoState.tetrixLineas;
    const gano = lineas >= 3; // Mínimo 3 líneas para ganar
    const coronas = gano ? CORONAS_POR_VICTORIA + Math.floor(lineas / 2) : 1;
    mostrarResultado({
      gano,
      emoji: gano ? '👑' : '💀',
      titulo: gano ? '¡Victoria Real!' : 'El Coliseo fue brutal...',
      desc: `Hiciste ${lineas} línea${lineas !== 1 ? 's' : ''} contra ${coliseoState.oponente ? coliseoState.oponente.nombre : 'el bot'}.`,
      coronas,
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  ══ JUEGO 2: STACKER DEL REY ══
  // ═══════════════════════════════════════════════════════════

  const STACKER_COLS = 7;
  const STACKER_VISIBLE_ROWS = 15;
  const STACKER_CELL = 30; // px
  const STACKER_BARRA_INICIO_ANCHO = 5; // celdas

  function iniciarStacker() {
    mostrarPantalla('stacker');
    document.getElementById('stacker-oponente-nombre').textContent = coliseoState.oponente ? coliseoState.oponente.nombre : 'Bot';

    // Reset
    coliseoState.stackerNivel = 0;
    coliseoState.stackerVidas = 3;
    coliseoState.stackerBarraPosX = 0;
    coliseoState.stackerDir = 1;
    coliseoState.stackerSpeed = 2; // px por frame
    coliseoState.stackerPilas = []; // Array de pilas colocadas: [{x, ancho}]
    coliseoState.stackerBarraAncho = STACKER_BARRA_INICIO_ANCHO;
    coliseoState.juegoActivo = 'stacker';

    actualizarUIStacker();

    if (coliseoState.stackerInterval) clearInterval(coliseoState.stackerInterval);
    coliseoState.stackerInterval = setInterval(stackerLoop, 1000 / 30); // 30fps
  }

  function stackerLoop() {
    if (coliseoState.juegoActivo !== 'stacker') return;
    coliseoState.stackerBarraPosX += coliseoState.stackerDir * coliseoState.stackerSpeed;
    const maxX = (STACKER_COLS - coliseoState.stackerBarraAncho) * STACKER_CELL;
    if (coliseoState.stackerBarraPosX >= maxX) {
      coliseoState.stackerBarraPosX = maxX;
      coliseoState.stackerDir = -1;
    } else if (coliseoState.stackerBarraPosX <= 0) {
      coliseoState.stackerBarraPosX = 0;
      coliseoState.stackerDir = 1;
    }
    stackerDibujar();
  }

  function stackerColocar() {
    if (coliseoState.juegoActivo !== 'stacker') return;

    const nivelPrevio = coliseoState.stackerPilas.length > 0 ?
      coliseoState.stackerPilas[coliseoState.stackerPilas.length - 1] : null;

    const posActualCelda = Math.round(coliseoState.stackerBarraPosX / STACKER_CELL);
    let anchoNuevo = coliseoState.stackerBarraAncho;

    if (nivelPrevio !== null) {
      // Calcular overlap con nivel anterior
      const startA = nivelPrevio.x;
      const endA = startA + nivelPrevio.ancho;
      const startB = posActualCelda;
      const endB = startB + anchoNuevo;

      const overlapStart = Math.max(startA, startB);
      const overlapEnd = Math.min(endA, endB);
      const overlap = overlapEnd - overlapStart;

      if (overlap <= 0) {
        // Miss total
        coliseoState.stackerVidas--;
        if (coliseoState.stackerVidas <= 0) {
          stackerFinJuego(false);
          return;
        }
        document.getElementById('stacker-vidas').textContent = coliseoState.stackerVidas;
        return; // No apila, intenta de nuevo
      }

      // Ajustar barra al overlap
      anchoNuevo = overlap;
      coliseoState.stackerBarraPosX = overlapStart * STACKER_CELL;
      coliseoState.stackerBarraAncho = anchoNuevo;
    }

    // Apilar
    coliseoState.stackerPilas.push({ x: posActualCelda, ancho: anchoNuevo });
    coliseoState.stackerNivel++;

    // Velocidad aumenta con el nivel
    coliseoState.stackerSpeed = 2 + coliseoState.stackerNivel * 0.4;

    actualizarUIStacker();

    if (coliseoState.stackerNivel >= STACKER_MAX_NIVELES) {
      stackerFinJuego(true);
    }
  }

  function stackerDibujar() {
    const canvas = document.getElementById('stacker-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const totalRows = STACKER_VISIBLE_ROWS;
    const startRowDraw = totalRows - 1;

    // Fondo grilla
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.5;
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < STACKER_COLS; c++) {
        ctx.strokeRect(c * STACKER_CELL, r * STACKER_CELL, STACKER_CELL, STACKER_CELL);
      }
    }

    // Pilas colocadas (desde abajo)
    const colores = ['#FF6B35','#FFD700','#FF6B35','#E91E8C','#00BCD4','#4CAF50','#9C27B0','#FF5722','#FFD700','#E91E8C'];
    coliseoState.stackerPilas.forEach((pila, idx) => {
      const rowDraw = startRowDraw - idx;
      ctx.fillStyle = colores[idx % colores.length];
      for (let c = pila.x; c < pila.x + pila.ancho; c++) {
        ctx.fillRect(c * STACKER_CELL + 1, rowDraw * STACKER_CELL + 1, STACKER_CELL - 2, STACKER_CELL - 2);
      }
    });

    // Barra móvil actual
    const barraRowDraw = startRowDraw - coliseoState.stackerPilas.length;
    if (barraRowDraw >= 0) {
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 8;
      for (let c = 0; c < coliseoState.stackerBarraAncho; c++) {
        const drawX = coliseoState.stackerBarraPosX + c * STACKER_CELL;
        ctx.fillRect(drawX + 1, barraRowDraw * STACKER_CELL + 1, STACKER_CELL - 2, STACKER_CELL - 2);
      }
      ctx.shadowBlur = 0;
    }
  }

  function actualizarUIStacker() {
    const nEl = document.getElementById('stacker-nivel');
    const vEl = document.getElementById('stacker-vidas');
    if (nEl) nEl.textContent = coliseoState.stackerNivel + 1;
    if (vEl) vEl.textContent = coliseoState.stackerVidas;
  }

  function stackerFinJuego(gano) {
    clearInterval(coliseoState.stackerInterval);
    coliseoState.stackerInterval = null;
    coliseoState.juegoActivo = null;

    const nivel = coliseoState.stackerNivel;
    const coronas = gano ? CORONAS_POR_VICTORIA + nivel : Math.max(1, Math.floor(nivel / 2));

    mostrarResultado({
      gano,
      emoji: gano ? '🏰' : '💔',
      titulo: gano ? '¡Castillo Perfecto!' : `Torre derrumbada en nivel ${nivel}`,
      desc: gano
        ? '¡Apilaste todas las burgers sin caer! Eres el maestro del Stacker.'
        : `Llegaste al nivel ${nivel} contra ${coliseoState.oponente ? coliseoState.oponente.nombre : 'el bot'}.`,
      coronas,
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  RESULTADO + CORONAS
  // ═══════════════════════════════════════════════════════════

  function mostrarResultado({ gano, emoji, titulo, desc, coronas }) {
    mostrarPantalla('resultado');

    document.getElementById('coliseo-resultado-emoji').textContent = emoji;
    document.getElementById('coliseo-resultado-titulo').textContent = titulo;
    document.getElementById('coliseo-resultado-desc').textContent = desc;
    document.getElementById('coliseo-resultado-coronas').textContent =
      `+${coronas} 👑 Coronas${gano ? ' ¡BONUS VICTORIA!' : ''}`;

    coliseoState.coronasGanadas += coronas;
    const counterEl = document.getElementById('coliseo-coronas-counter');
    if (counterEl) counterEl.textContent = coliseoState.coronasGanadas;

    // Guardar coronas en localStorage
    const prevCoronas = parseInt(localStorage.getItem('king_coronas') || '0');
    const newCoronas = prevCoronas + coronas;
    localStorage.setItem('king_coronas', newCoronas.toString());

    // Guardar en Firestore si hay usuario logueado
    if (window.getCurrentKingUser && typeof window.getCurrentKingUser === 'function') {
      const user = window.getCurrentKingUser();
      if (user && window.firebase && window.firebase.firestore) {
        try {
          window.firebase.firestore().collection('coliseo_duelos').add({
            uid: user.uid,
            juego: coliseoState.juegoActivo || 'unknown',
            resultado: gano ? 'victoria' : 'derrota',
            coronas: coronas,
            oponente: coliseoState.oponente ? coliseoState.oponente.nombre : 'Bot',
            timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
          });
          // Actualizar coronas totales del usuario
          window.firebase.firestore().collection('users').doc(user.uid).set(
            { coronas_totales: window.firebase.firestore.FieldValue.increment(coronas) },
            { merge: true }
          );
        } catch (e) {
          console.warn('⚔️ Coliseo: No se pudo guardar en Firestore', e);
        }
      }
    }

    coliseoState.resultadoFinal = { gano, coronas };
  }

  // ═══════════════════════════════════════════════════════════
  //  BANNER POST-PEDIDO
  // ═══════════════════════════════════════════════════════════

  function mostrarBannerColiseo() {
    inyectarModalColiseo();
    const banner = document.getElementById('coliseo-banner');
    if (banner) {
      banner.style.display = 'block';
      // Auto-ocultar después de 15 segundos
      setTimeout(() => {
        if (banner.style.display !== 'none') banner.style.display = 'none';
      }, 15000);
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  API PÚBLICA
  // ═══════════════════════════════════════════════════════════

  window.ColiseoRey = {
    version: COLISEO_VERSION,
    mostrarBannerColiseo,
    abrirColiseo: function() {
      inyectarModalColiseo();
      abrirColiseo();
    },
    cerrarColiseo,
  };

  // Auto-inyectar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inyectarModalColiseo);
  } else {
    inyectarModalColiseo();
  }

  console.log('⚔️ Coliseo del Rey v' + COLISEO_VERSION + ' — LISTO');

})();
