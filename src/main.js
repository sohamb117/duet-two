const { ipcRenderer } = window.require('electron')
import { parseOsu } from './parser.js'
import { loadAudio, play, stop, setOffset, initAudio, isReady, playHitSound, loadHitSound } from './audio.js'
import { initRenderer, clearFrame, drawStatic, drawButtons, drawNote } from './renderer.js'
import { initGame, loadMap, startGame, stopGame, update, getDots, triggerLane, setTravelTime } from './game.js'
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
  onScore: (score, combo, accuracy) => updateScore(score, combo, accuracy),
  onEnd:   (score, max, accuracy)  => showResults(score, max, accuracy, 'WIN'),
  onFail:  (score, max, accuracy)  => showResults(score, max, accuracy, 'FAILED'),
})

initUI({
  onLoadOsu:   loadOsu,
  onLoadAudio: loadAudioFile,
  onStart:     startRound,
  onRetry:     retry,
  onOffset:    ms => setOffset(ms),
  onSpeed:     seconds => setTravelTime(seconds),
})

// ── load hit sounds ───────────────────────────────────────────────────────
async function loadHitSounds() {
  initAudio()
  const hitSoundFiles = [
    '/hitsounds/lane0.wav',
    '/hitsounds/lane1.wav',
    '/hitsounds/lane2.wav',
    '/hitsounds/lane3.wav',
    '/hitsounds/lane4.wav',
    '/hitsounds/lane5.wav',
  ]

  for (let i = 0; i < hitSoundFiles.length; i++) {
    try {
      const response = await fetch(hitSoundFiles[i])
      const arrayBuffer = await response.arrayBuffer()
      await loadHitSound(i, arrayBuffer)
      console.log(`Loaded hit sound for lane ${i}`)
    } catch (err) {
      console.log(`No custom hit sound for lane ${i}, will use default beep`)
    }
  }
}

// Load hit sounds on startup
loadHitSounds()

// Auto-load game files on startup
loadOsu()
loadAudioFile()

// ── file loading ──────────────────────────────────────────────────────────────
async function loadOsu() {
  try {
    setStatus('loading beatmap...')
    const response = await fetch('assets/gamedata/natalia.osu')
    const text = await response.text()
    const map = parseOsu(text)
    if (map.notes.length === 0) { setStatus('no hit objects found'); return }
    loadMap(map)
    setMapInfo(map.title, map.artist)
    setStatus(map.notes.length + ' notes loaded')
    mapReady = true
    checkReady()
  } catch (err) {
    setStatus('error loading beatmap: ' + err.message)
  }
}

async function loadAudioFile() {
  try {
    initAudio()
    setStatus('loading audio...')
    const response = await fetch('assets/gamedata/natalia.mp3')
    const arrayBuffer = await response.arrayBuffer()
    setStatus('decoding...')
    await loadAudio(arrayBuffer)
    setStatus('audio ready')
    audReady = true
    checkReady()
  } catch (err) {
    setStatus('error loading audio: ' + err.message)
  }
}

function checkReady() {
  setStartEnabled(mapReady && audReady)
}

// ── game flow ─────────────────────────────────────────────────────────────────
function startRound() {
  showHUD()
  updateScore(0, 0, 100)
  play()
  startGame()
}

function retry() {
  stop()
  showStartScreen()
  mapReady = false
  audReady = false
  setStatus('')
  setStartEnabled(false)
  loadOsu()
  loadAudioFile()
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