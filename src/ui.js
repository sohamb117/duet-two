let onLoadOsu   = () => {}
let onLoadAudio = () => {}
let onStart     = () => {}
let onRetry     = () => {}
let onOffset    = () => {}
let onSpeed = () => {}

export function initUI(callbacks) {
  onLoadOsu   = callbacks.onLoadOsu   || onLoadOsu
  onLoadAudio = callbacks.onLoadAudio || onLoadAudio
  onStart     = callbacks.onStart     || onStart
  onRetry     = callbacks.onRetry     || onRetry
  onOffset    = callbacks.onOffset    || onOffset
  onSpeed     = callbacks.onSpeed     || onSpeed

  injectStyles()
  buildStartScreen()
  buildHUD()
}

// ── Start screen ──────────────────────────────────────────────────────────────
function buildStartScreen() {
  const screen = el('div', 'screen start-screen', 'start-screen')
  screen.innerHTML = `
    <h1>RHYTHM</h1>
    <div id="map-title">no map loaded</div>
    <div id="map-artist"></div>
    <div id="status-line"></div>
    <div class="row" style="margin-top:12px">
      <button id="btn-osu">load .osu</button>
      <button id="btn-audio">load audio</button>
    </div>
    <div class="row" style="margin-top:8px">
      <button id="btn-start" disabled>START</button>
    </div>
    <div class="offset-row">
      <span class="dim">OFFSET</span>
      <input type="range" id="offset-slider" min="-200" max="200" step="1" value="0">
      <span id="offset-val">0 ms</span>
    </div>
    <div class="offset-row">
  <span class="dim">SPEED</span>
  <input type="range" id="speed-slider" min="0.5" max="5.0" step="0.1" value="2.5">
  <span id="speed-val">2.5s</span>
</div>
    <div class="key-legend">A &nbsp;|&nbsp; S &nbsp;|&nbsp; D &nbsp;|&nbsp; J &nbsp;|&nbsp; K &nbsp;|&nbsp; L</div>
  `
  document.getElementById('app').appendChild(screen)

  document.getElementById('btn-osu').addEventListener('click', onLoadOsu)
  document.getElementById('btn-audio').addEventListener('click', onLoadAudio)
  document.getElementById('btn-start').addEventListener('click', onStart)
  document.getElementById('offset-slider').addEventListener('input', e => {
    const ms = parseInt(e.target.value)
    document.getElementById('offset-val').textContent = ms + ' ms'
    onOffset(ms)
  })
  document.getElementById('speed-slider').addEventListener('input', e => {
    const val = parseFloat(e.target.value)
    document.getElementById('speed-val').textContent = val.toFixed(1) + 's'
    onSpeed(val)
  })
}

// ── HUD ───────────────────────────────────────────────────────────────────────
function buildHUD() {
  const hud = el('div', 'hud hidden', 'hud')
  hud.innerHTML = `
    <div id="score">0</div>
    <div id="combo"></div>
    <div id="feedback"></div>
  `
  document.getElementById('app').appendChild(hud)
}

// ── Results screen ────────────────────────────────────────────────────────────
function buildResultsScreen(score, maxCombo) {
  let screen = document.getElementById('results-screen')
  if (screen) screen.remove()

  screen = el('div', 'screen results-screen', 'results-screen')
  screen.innerHTML = `
    <h1>RESULT</h1>
    <div id="map-title-result">${document.getElementById('map-title').textContent}</div>
    <div class="final-score">${score}</div>
    <div class="dim" style="letter-spacing:0.15em;font-size:11px">MAX COMBO ${maxCombo}</div>
    <button id="btn-retry" style="margin-top:20px">RETRY</button>
  `
  document.getElementById('app').appendChild(screen)
  document.getElementById('btn-retry').addEventListener('click', onRetry)
}

// ── Public update methods ─────────────────────────────────────────────────────
let feedbackTimeout = null

export function setMapInfo(title, artist) {
  document.getElementById('map-title').textContent  = title  || 'untitled'
  document.getElementById('map-artist').textContent = artist || ''
}

export function setStatus(msg) {
  document.getElementById('status-line').textContent = msg
}

export function setStartEnabled(enabled) {
  document.getElementById('btn-start').disabled = !enabled
}

export function updateScore(score, combo) {
  document.getElementById('score').textContent = score
  const comboEl = document.getElementById('combo')
  comboEl.textContent = combo >= 4 ? `× ${combo} COMBO` : ''
}

export function showFeedback(grade) {
  const el     = document.getElementById('feedback')
  const colors = { PERFECT: '#7cb4f5', GOOD: '#f5e37c', MISS: '#f57c7c' }
  el.textContent   = grade
  el.style.color   = colors[grade] || 'black'
  el.style.opacity = 1
  clearTimeout(feedbackTimeout)
  feedbackTimeout = setTimeout(() => el.style.opacity = 0, 400)
}

export function showStartScreen() {
  document.getElementById('start-screen').classList.remove('hidden')
  document.getElementById('hud').classList.add('hidden')
  const r = document.getElementById('results-screen')
  if (r) r.remove()
}

export function showHUD() {
  document.getElementById('start-screen').classList.add('hidden')
  document.getElementById('hud').classList.remove('hidden')
}

export function showResults(score, maxCombo) {
  document.getElementById('hud').classList.add('hidden')
  buildResultsScreen(score, maxCombo)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function el(tag, className, id) {
  const e = document.createElement(tag)
  if (className) e.className = className
  if (id)        e.id        = id
  return e
}

function injectStyles() {
  const style = document.createElement('style')
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Bebas+Neue&display=swap');

    :root {
      --bg:      #ffffff;
      --accent:  #000000;
      --accent3: #000000;
      --red:     #000000;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: var(--bg);
      color: var(--accent);
      font-family: 'Share Tech Mono', monospace;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    #app {
      position: relative;
      width: 800px;
      height: 800px;
    }

    #game-canvas {
      position: absolute;
      inset: 0;
    }

    /* ── screens ── */
    .screen {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.92);
      z-index: 20;
      gap: 8px;
    }

    .screen h1 {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 72px;
      letter-spacing: 0.2em;
      color: var(--accent);
      text-shadow: none;
      line-height: 1;
    }

    #map-title, #map-title-result {
      font-size: 13px;
      color: rgba(0,0,0,0.7);
      letter-spacing: 0.12em;
    }

    #map-artist {
      font-size: 11px;
      color: rgba(0,0,0,0.5);
      letter-spacing: 0.1em;
      min-height: 16px;
    }

    #status-line {
      font-size: 10px;
      color: rgba(0,0,0,0.4);
      letter-spacing: 0.1em;
      min-height: 14px;
    }

    .row {
      display: flex;
      gap: 10px;
    }

    button {
      background: transparent;
      border: 1px solid var(--accent);
      color: var(--accent);
      font-family: 'Bebas Neue', sans-serif;
      font-size: 18px;
      letter-spacing: 0.2em;
      padding: 8px 28px;
      cursor: pointer;
      transition: background 0.12s, box-shadow 0.12s;
    }

    button:hover:not(:disabled) {
      background: var(--accent);
      color: var(--bg);
      box-shadow: 0 0 12px var(--accent);
    }

    button:disabled {
      opacity: 0.25;
      cursor: default;
    }

    .offset-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
      font-size: 10px;
      letter-spacing: 0.1em;
    }

    .dim { color: rgba(0,0,0,0.5); }

    #offset-slider {
      -webkit-appearance: none;
      width: 140px;
      height: 2px;
      background: rgba(0,0,0,0.2);
      outline: none;
    }

    #speed-slider {
      -webkit-appearance: none;
      width: 140px;
      height: 2px;
      background: rgba(0,0,0,0.2);
      outline: none;
    }

    #offset-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
    }
    
    #speed-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
    }

    #offset-val { color: var(--accent); width: 44px; }

    #speed-val { color: var(--accent); width: 44px; }

    .key-legend {
      font-size: 11px;
      color: rgba(0,0,0,0.4);
      letter-spacing: 0.12em;
      margin-top: 4px;
    }

    /* ── HUD ── */
    .hud {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 10;
    }

    .hidden { display: none !important; }

    #score {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 52px;
      letter-spacing: 0.12em;
      color: black;
      text-shadow: none;
      line-height: 1;
    }

    #combo {
      font-size: 12px;
      color: var(--accent3);
      letter-spacing: 0.2em;
      min-height: 18px;
      margin-top: 4px;
    }

    #feedback {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 30px;
      letter-spacing: 0.15em;
      min-height: 38px;
      margin-top: 4px;
      transition: opacity 0.15s;
    }

    .final-score {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 80px;
      color: var(--accent);
      text-shadow: none;
      letter-spacing: 0.1em;
      line-height: 1;
    }
  `
  document.head.appendChild(style)
}