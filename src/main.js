const { ipcRenderer } = window.require('electron')
import { parseOsu } from './parser.js'
import { loadAudio, play, stop, setOffset, initAudio, isReady, playHitSound } from './audio.js'
import { initRenderer, clearFrame, drawStatic, drawButtons, drawNote } from './renderer.js'
import { initGame, loadMap, startGame, stopGame, update, getDots, triggerLane } from './game.js'
import { initUI, setMapInfo, setStatus, setStartEnabled, updateScore, showFeedback, showStartScreen, showHUD, showResults } from './ui.js'
import { initGamepad, pollGamepads, getPressedLanes } from './gamepad.js'

// ── state ─────────────────────────────────────────────────────────────────────
const pressed  = new Set()
const KEYS     = ['j','k','l','d','s','a']
let   mapReady = false
let   audReady = false

// ── init ──────────────────────────────────────────────────────────────────────
initRenderer()
initGamepad()

initGame({
  onHit:   (lane, grade) => showFeedback(grade),
  onMiss:  ()            => showFeedback('MISS'),
  onScore: (score, combo) => updateScore(score, combo),
  onEnd:   (score, max)  => showResults(score, max),
})

initUI({
  onLoadOsu:   loadOsu,
  onLoadAudio: loadAudioFile,
  onStart:     startRound,
  onRetry:     retry,
  onOffset:    ms => setOffset(ms),
})

// ── file loading ──────────────────────────────────────────────────────────────
async function loadOsu() {
  const file = await ipcRenderer.invoke('open-osu')
  if (!file) return
  const map = parseOsu(file.content)
  if (map.notes.length === 0) { setStatus('no hit objects found'); return }
  loadMap(map)
  setMapInfo(map.title, map.artist)
  setStatus(map.notes.length + ' notes loaded')
  mapReady = true
  checkReady()
}

async function loadAudioFile() {
  initAudio()
  const file = await ipcRenderer.invoke('open-audio')
  if (!file) return
  setStatus('decoding...')
  await loadAudio(file.buffer)
  setStatus('audio ready')
  audReady = true
  checkReady()
}

function checkReady() {
  setStartEnabled(mapReady && audReady)
}

// ── game flow ─────────────────────────────────────────────────────────────────
function startRound() {
  showHUD()
  updateScore(0, 0)
  play()
  startGame()
}

function retry() {
  stop()
  showStartScreen()
  audReady = false
  setStatus('')
  setStartEnabled(false)
}

// ── input ─────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.repeat) return
  const idx = KEYS.indexOf(e.key.toLowerCase())
  if (idx !== -1) {
    pressed.add(idx)
    playHitSound(idx)
    triggerLane(idx)
  }
})


document.addEventListener('keyup', e => {
  const idx = KEYS.indexOf(e.key.toLowerCase())
  if (idx !== -1) pressed.delete(idx)
})

// ── loop ──────────────────────────────────────────────────────────────────────
function loop() {
  // Poll gamepad input
  pollGamepads(
    (lane) => {
      playHitSound(lane)
      triggerLane(lane)
    },
    (lane) => {} // Release callback (not needed for gameplay)
  )

  update()
  const now = performance.now()
  clearFrame()
  drawStatic()

  // Merge keyboard and gamepad pressed states for rendering
  const allPressed = new Set([...pressed, ...getPressedLanes()])
  drawButtons(allPressed)

  for (const dot of getDots()) drawNote(dot, now)
  requestAnimationFrame(loop)
}

loop()