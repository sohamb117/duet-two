const { ipcRenderer } = window.require('electron')
import { parseOsu } from './parser.js'
import { loadAudio, play, stop, setOffset, setVolume, initAudio, isReady, playHitSound, loadHitSound, songTime, getAudioDuration } from './audio.js'
import { initRenderer, clearFrame, drawStatic, drawButtons, drawNote } from './renderer.js'
import { initGame, loadMap, startGame, stopGame, update, getDots, triggerLane } from './game.js'
import { initUI, setMapInfo, setStatus, setStartEnabled, updateScore, showFeedback, showStartScreen, showHUD, showResults, updateLevelInfo, updateProgressBar, showPasswordScreen, hidePasswordScreen, setPasswordError, applyBackgrounds } from './ui.js'
import { initGamepad, pollGamepads, getPressedLanes } from './gamepad.js'
import { loadAllBackgrounds } from './decrypt.js'

// ── state ─────────────────────────────────────────────────────────────────────
const pressed  = new Set()
const KEYS     = ['j','k','l','d','s','a']
let   mapReady = false
let   audReady = false
let   backgroundsReady = false

// ── level progression ─────────────────────────────────────────────────────────
const TOTAL_LEVELS = 4
let   currentLevel = 0

// ── init ──────────────────────────────────────────────────────────────────────
initRenderer()
initGamepad()

initGame({
  onHit:   (lane, grade) => showFeedback(grade),
  onMiss:  ()            => showFeedback('MISS'),
  onScore: (score, combo, accuracy) => updateScore(score, combo, accuracy),
  onEnd:   (score, max, accuracy)  => showResults(score, max, accuracy, 'WIN', currentLevel, TOTAL_LEVELS),
  onFail:  (score, max, accuracy)  => showResults(score, max, accuracy, 'FAILED', currentLevel, TOTAL_LEVELS),
})

initUI({
  onLoadOsu:   loadOsu,
  onLoadAudio: loadAudioFile,
  onStart:     startRound,
  onRetry:     retry,
  onNextLevel: nextLevel,
  onOffset:    ms => setOffset(ms),
  onVolume:    volume => setVolume(volume),
  onPasswordSubmit: handlePasswordSubmit,
})

// Update UI with initial level info
updateLevelInfo(currentLevel, TOTAL_LEVELS)

// ── password and background loading ───────────────────────────────────────────
async function handlePasswordSubmit(password) {
  try {
    setPasswordError('')
    console.log('Loading encrypted backgrounds...')

    // Load and decrypt backgrounds
    const backgrounds = await loadAllBackgrounds(password)

    // Apply backgrounds to UI
    applyBackgrounds(backgrounds)

    // Hide password screen and show start screen
    hidePasswordScreen()
    showStartScreen()

    backgroundsReady = true
    console.log('Backgrounds loaded successfully!')

    // Now load game files
    loadOsu()
    loadAudioFile()
  } catch (err) {
    console.error('Failed to load backgrounds:', err)
    setPasswordError('Incorrect password or failed to decrypt backgrounds')
  }
}

// Show password screen on startup
showPasswordScreen()

// ── load hit sounds ───────────────────────────────────────────────────────
async function loadHitSounds() {
  initAudio()
  const hitSoundFiles = [
    '/hitsounds/l1.wav',
    '/hitsounds/l2.wav',
    '/hitsounds/torso.wav',
    '/hitsounds/head.wav',
    '/hitsounds/r1.wav',
    '/hitsounds/r2.wav',
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

// ── file loading ──────────────────────────────────────────────────────────────
async function loadOsu() {
  try {
    setStatus('loading beatmap...')
    const response = await fetch(`assets/gamedata/level${currentLevel}/beatmap.osu`)
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
    const response = await fetch(`assets/gamedata/level${currentLevel}/audio.mp3`)
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

function nextLevel() {
  if (currentLevel < TOTAL_LEVELS - 1) {
    currentLevel++
    updateLevelInfo(currentLevel, TOTAL_LEVELS)
    retry()
  }
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

  // Update progress bar based on current playback position
  const currentTime = songTime()
  const duration = getAudioDuration()
  if (duration > 0) {
    updateProgressBar(currentTime, duration)
  }

  requestAnimationFrame(loop)
}

loop()