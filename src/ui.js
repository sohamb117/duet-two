let onLoadOsu   = () => {}
let onLoadAudio = () => {}
let onStart     = () => {}
let onRetry     = () => {}
let onNextLevel = () => {}
let onOffset    = () => {}
let onVolume    = () => {}
let onPasswordSubmit = () => {}

let currentLevel = 0
let totalLevels  = 4

export function initUI(callbacks) {
  onLoadOsu   = callbacks.onLoadOsu   || onLoadOsu
  onLoadAudio = callbacks.onLoadAudio || onLoadAudio
  onStart     = callbacks.onStart     || onStart
  onRetry     = callbacks.onRetry     || onRetry
  onNextLevel = callbacks.onNextLevel || onNextLevel
  onOffset    = callbacks.onOffset    || onOffset
  onVolume    = callbacks.onVolume    || onVolume
  onPasswordSubmit = callbacks.onPasswordSubmit || onPasswordSubmit

  injectStyles()
  buildPasswordScreen()
  buildStartScreen()
  buildHUD()
}

export function updateLevelInfo(level, total) {
  currentLevel = level
  totalLevels  = total

  // Update start screen level display
  const levelDisplay = document.getElementById('level-display')
  if (levelDisplay) {
    levelDisplay.textContent = `LEVEL ${level + 1} / ${total}`
  }

  // Reset progress bar to 0% for new level
  const progressBar = document.getElementById('progress-bar-fill')
  if (progressBar) {
    progressBar.style.width = '0%'
  }

  // Update HUD level display
  const hudLevel = document.getElementById('hud-level')
  if (hudLevel) {
    hudLevel.textContent = `LEVEL ${level + 1}`
  }

  // Update background for new level
  updateBackgroundForLevel(level)
}

export function updateProgressBar(currentTime, duration) {
  if (duration <= 0) return

  const progress = Math.min(100, (currentTime / duration) * 100)

  // Update start screen progress bar
  const progressBar = document.getElementById('progress-bar-fill')
  if (progressBar) {
    progressBar.style.width = progress + '%'
  }

  // Update HUD progress bar
  const progressBarHud = document.getElementById('progress-bar-fill-hud')
  if (progressBarHud) {
    progressBarHud.style.width = progress + '%'
  }
}

// ── Password screen ───────────────────────────────────────────────────────────
function buildPasswordScreen() {
  const screen = el('div', 'screen password-screen', 'password-screen')
  screen.innerHTML = `
    <h1>RHYTHM</h1>
    <div class="password-prompt">
      <p class="dim" style="margin-bottom: 16px; letter-spacing: 0.1em; font-size: 11px;">ENTER PASSWORD TO DECRYPT BACKGROUNDS</p>
      <input type="password" id="password-input" placeholder="password" autocomplete="off">
      <div id="password-error" class="password-error"></div>
      <button id="btn-password-submit">UNLOCK</button>
    </div>
  `
  document.getElementById('app').appendChild(screen)

  const input = document.getElementById('password-input')
  const button = document.getElementById('btn-password-submit')

  button.addEventListener('click', () => {
    const password = input.value
    if (password) {
      button.disabled = true
      button.textContent = 'DECRYPTING...'
      onPasswordSubmit(password)
      // Note: button will be re-enabled if password is wrong
      setTimeout(() => {
        button.disabled = false
        button.textContent = 'UNLOCK'
      }, 2000)
    }
  })

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      button.click()
    }
  })
}

export function showPasswordScreen() {
  const screen = document.getElementById('password-screen')
  if (screen) {
    screen.classList.remove('hidden')
    // Focus the input after a short delay
    setTimeout(() => {
      document.getElementById('password-input').focus()
    }, 100)
  }
}

export function hidePasswordScreen() {
  const screen = document.getElementById('password-screen')
  if (screen) {
    screen.classList.add('hidden')
  }
}

export function setPasswordError(msg) {
  const errorEl = document.getElementById('password-error')
  if (errorEl) {
    errorEl.textContent = msg
  }
}

// ── Background management ─────────────────────────────────────────────────────
let backgrounds = null

export function applyBackgrounds(backgroundsData) {
  backgrounds = backgroundsData
  updateBackgroundForLevel(currentLevel)
}

function updateBackgroundForLevel(level) {
  if (!backgrounds) return

  const app = document.getElementById('app')

  // Only apply backgrounds for levels 1 and 2
  if (level === 1 && backgrounds.natalia_bg) {
    app.style.backgroundImage = `url(${backgrounds.natalia_bg})`
    app.style.backgroundSize = 'cover'
    app.style.backgroundPosition = 'center'
  } else if (level === 2 && backgrounds.tally_bg) {
    app.style.backgroundImage = `url(${backgrounds.tally_bg})`
    app.style.backgroundSize = 'cover'
    app.style.backgroundPosition = 'center'
  } else {
    // Levels 0 and 3 have no background
    app.style.backgroundImage = 'none'
  }
}

// ── Start screen ──────────────────────────────────────────────────────────────
function buildStartScreen() {
  const screen = el('div', 'screen start-screen hidden', 'start-screen')
  screen.innerHTML = `
    <div id="progress-bar">
      <div id="progress-bar-fill"></div>
    </div>
    <h1>RHYTHM</h1>
    <div id="level-display">LEVEL 1 / 4</div>
    <div id="map-title">loading...</div>
    <div id="map-artist"></div>
    <div id="status-line">loading beatmap and audio...</div>
    <div class="row" style="margin-top:12px">
      <button id="btn-start" disabled>START</button>
    </div>
    <div class="offset-row">
      <span class="dim">OFFSET</span>
      <input type="range" id="offset-slider" min="-200" max="200" step="1" value="0">
      <span id="offset-val">0 ms</span>
    </div>
    <div class="offset-row">
      <span class="dim">VOLUME</span>
      <input type="range" id="volume-slider" min="0" max="100" step="1" value="20">
      <span id="volume-val">20%</span>
    </div>
    <div class="key-legend">A &nbsp;|&nbsp; S &nbsp;|&nbsp; D &nbsp;|&nbsp; J &nbsp;|&nbsp; K &nbsp;|&nbsp; L</div>
  `
  document.getElementById('app').appendChild(screen)

  document.getElementById('btn-start').addEventListener('click', onStart)
  document.getElementById('offset-slider').addEventListener('input', e => {
    const ms = parseInt(e.target.value)
    document.getElementById('offset-val').textContent = ms + ' ms'
    onOffset(ms)
  })
  document.getElementById('volume-slider').addEventListener('input', e => {
    const val = parseInt(e.target.value)
    document.getElementById('volume-val').textContent = val + '%'
    onVolume(val / 100)
  })
}

// ── HUD ───────────────────────────────────────────────────────────────────────
function buildHUD() {
  const hud = el('div', 'hud hidden', 'hud')
  hud.innerHTML = `
    <div id="progress-bar-hud">
      <div id="progress-bar-fill-hud"></div>
    </div>
    <div id="hud-level">LEVEL 1</div>
    <div id="score">0</div>
    <div id="combo"></div>
    <div id="accuracy">100.0%</div>
    <div id="feedback"></div>
  `
  document.getElementById('app').appendChild(hud)
}

// ── Results screen ────────────────────────────────────────────────────────────
function buildResultsScreen(score, maxCombo, accuracy, resultType, level, total) {
  let screen = document.getElementById('results-screen')
  if (screen) screen.remove()

  const resultColor = resultType === 'WIN' ? '#7cb4f5' : '#f57c7c'
  const isLastLevel = level >= total - 1
  const showNextLevel = resultType === 'WIN' && !isLastLevel

  let buttons = ''
  if (showNextLevel) {
    buttons = `
      <div class="row" style="margin-top:20px">
        <button id="btn-retry">RETRY</button>
        <button id="btn-next-level" class="next-level-btn">NEXT LEVEL</button>
      </div>
    `
  } else {
    buttons = `<button id="btn-retry" style="margin-top:20px">RETRY</button>`
  }

  screen = el('div', 'screen results-screen', 'results-screen')
  screen.innerHTML = `
    <h1 style="color: ${resultColor}">${resultType}!</h1>
    <div id="result-level-display">LEVEL ${level + 1} / ${total}</div>
    <div id="map-title-result">${document.getElementById('map-title').textContent}</div>
    <div class="final-score">${score}</div>
    <div class="dim" style="letter-spacing:0.15em;font-size:11px">MAX COMBO ${maxCombo}</div>
    <div class="dim" style="letter-spacing:0.15em;font-size:11px;margin-top:4px">ACCURACY ${accuracy.toFixed(1)}%</div>
    ${buttons}
  `
  document.getElementById('app').appendChild(screen)
  document.getElementById('btn-retry').addEventListener('click', onRetry)

  if (showNextLevel) {
    document.getElementById('btn-next-level').addEventListener('click', onNextLevel)
  }
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

export function updateScore(score, combo, accuracy) {
  document.getElementById('score').textContent = score
  const comboEl = document.getElementById('combo')
  comboEl.textContent = combo >= 4 ? `× ${combo} COMBO` : ''
  if (accuracy !== undefined) {
    const accuracyEl = document.getElementById('accuracy')
    accuracyEl.textContent = accuracy.toFixed(1) + '%'
    // Color based on accuracy
    if (accuracy < 50) {
      accuracyEl.style.color = '#f57c7c'
    } else if (accuracy < 75) {
      accuracyEl.style.color = '#f5e37c'
    } else {
      accuracyEl.style.color = '#7cb4f5'
    }
  }
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
  document.getElementById('accuracy').textContent = '100.0%'
  document.getElementById('accuracy').style.color = '#7cb4f5'

  // Reset HUD progress bar to 0%
  const progressBarHud = document.getElementById('progress-bar-fill-hud')
  if (progressBarHud) {
    progressBarHud.style.width = '0%'
  }

  // Update HUD level display
  const hudLevel = document.getElementById('hud-level')
  if (hudLevel) {
    hudLevel.textContent = `LEVEL ${currentLevel + 1}`
  }
}

export function showResults(score, maxCombo, accuracy, resultType, level, total) {
  document.getElementById('hud').classList.add('hidden')
  buildResultsScreen(score, maxCombo, accuracy, resultType, level, total)
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

    #level-display, #result-level-display {
      font-size: 11px;
      color: rgba(0,0,0,0.6);
      letter-spacing: 0.15em;
      margin-bottom: 6px;
      font-weight: bold;
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

    #offset-slider, #volume-slider {
      -webkit-appearance: none;
      width: 140px;
      height: 2px;
      background: rgba(0,0,0,0.2);
      outline: none;
    }

    #offset-slider::-webkit-slider-thumb, #volume-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
    }

    #offset-val, #volume-val { color: var(--accent); width: 44px; }

    .key-legend {
      font-size: 11px;
      color: rgba(0,0,0,0.4);
      letter-spacing: 0.12em;
      margin-top: 4px;
    }

    /* ── Password screen ── */
    .password-screen {
      background: rgba(255,255,255,0.98);
    }

    .password-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    #password-input {
      width: 280px;
      padding: 10px 16px;
      font-family: 'Share Tech Mono', monospace;
      font-size: 14px;
      letter-spacing: 0.1em;
      text-align: center;
      border: 1px solid var(--accent);
      background: transparent;
      color: var(--accent);
      outline: none;
    }

    #password-input::placeholder {
      color: rgba(0,0,0,0.3);
      letter-spacing: 0.1em;
    }

    #password-input:focus {
      box-shadow: 0 0 8px rgba(0,0,0,0.2);
    }

    .password-error {
      font-size: 10px;
      color: #f57c7c;
      letter-spacing: 0.1em;
      min-height: 14px;
      text-align: center;
    }

    /* ── Progress bars ── */
    #progress-bar, #progress-bar-hud {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: rgba(0,0,0,0.1);
      z-index: 30;
    }

    #progress-bar-fill, #progress-bar-fill-hud {
      height: 100%;
      background: var(--accent);
      transition: width 0.3s ease;
      width: 0%;
    }

    .next-level-btn {
      background: var(--accent) !important;
      color: var(--bg) !important;
      box-shadow: 0 0 12px var(--accent);
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

    #hud-level {
      position: absolute;
      top: 12px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      color: rgba(0,0,0,0.5);
      letter-spacing: 0.15em;
      font-weight: bold;
    }

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

    #accuracy {
      font-size: 11px;
      letter-spacing: 0.15em;
      min-height: 16px;
      margin-top: 2px;
      font-weight: bold;
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