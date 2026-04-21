const { ipcRenderer } = window.require('electron')
import { parseOsu } from './parser.js'
import { loadAudio, play, stop, setOffset, setVolume, initAudio, isReady, playHitSound, loadHitSound, songTime, getAudioDuration, setOnSongEnd } from './audio.js'
import { initRenderer, clearFrame, drawStatic, drawButtons, drawNote } from './renderer.js'
import { initGame, loadMap, startGame, stopGame, update, getDots, triggerLane, setFreePlayMode, getRecordedBeats, loadRecordedBeats, endFreePlay } from './game.js'
import { initUI, setMapInfo, setStatus, setStartEnabled, updateScore, showFeedback, showStartScreen, showHUD, showResults, updateLevelInfo, updateProgressBar, triggerDieFlash } from './ui.js'
import { initGamepad, pollGamepads, getPressedLanes } from './gamepad.js'
import './backgrounds.css'

// ── state ─────────────────────────────────────────────────────────────────────
const pressed  = new Set()
const KEYS     = ['j','k','l','d','s','a']
let   mapReady = false
let   audReady = false

// ── level progression ─────────────────────────────────────────────────────────
const TOTAL_LEVELS = 3
let   currentLevel = 2
let   level1RecordedBeats = null  // Store beats recorded in level 1
let   dieFlashTriggered = false   // Track if DIE flash has been shown

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

// Set up callback for when song ends
setOnSongEnd(() => {
  if (currentLevel === 1) {
    // Level 1: end free-play recording
    endFreePlay()
  } else {
    // Other levels: handled by game.js end condition
    // This is just a safety fallback
  }
})

initUI({
  onLoadOsu:   loadOsu,
  onLoadAudio: loadAudioFile,
  onStart:     startRound,
  onRetry:     retry,
  onNextLevel: nextLevel,
  onOffset:    ms => setOffset(ms),
  onVolume:    volume => setVolume(volume),
})

// Update UI with initial level info
updateLevelInfo(currentLevel, TOTAL_LEVELS)

// Show start screen on startup
showStartScreen()

// Load game files
loadOsu()
loadAudioFile()

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
  // Level 1 is free-play mode with no beatmap
  if (currentLevel === 1) {
    setFreePlayMode(true)
    setMapInfo('Free Play', 'Practice Mode')
    setStatus('press keys to record beats')
    mapReady = true
    checkReady()
    return
  }

  // Level 2 uses recorded beats from level 1
  if (currentLevel === 2 && level1RecordedBeats && level1RecordedBeats.length > 0) {
    setStatus('loading your recorded beatmap...')
    loadRecordedBeats(level1RecordedBeats)
    setMapInfo('Your Recording', `${level1RecordedBeats.length} notes`)
    setStatus('play back your beats!')
    mapReady = true
    checkReady()
    return
  }

  try {
    setStatus('loading beatmap...')
    const response = await fetch(`/gamedata/level${currentLevel}/beatmap.osu`)
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
    const response = await fetch(`/gamedata/level${currentLevel}/audio.mp3`)
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
  dieFlashTriggered = false  // Reset flash trigger for new round
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
    // If leaving level 1, save the recorded beats
    if (currentLevel === 1) {
      level1RecordedBeats = getRecordedBeats()
      console.log(`Recorded ${level1RecordedBeats.length} beats from level 1`)
    }

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

    // Trigger DIE flash on level 2 (index 2) when 5 seconds remain
    if (currentLevel === 2 && !dieFlashTriggered && duration - currentTime <= 5 && duration - currentTime > 4.5) {
      triggerDieFlash()
      dieFlashTriggered = true
    }
  }

  requestAnimationFrame(loop)
}

loop()