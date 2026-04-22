import { songTime } from './audio.js'

var TRAVEL_TIME       = 2.5
const HIT_WINDOW_PERFECT = 0.060
const HIT_WINDOW_GOOD    = 0.120
const MISS_WINDOW        = 0.150

const SCORE_PERFECT = 300
const SCORE_GOOD    = 100

// Level durations in seconds
const LEVEL_DURATIONS = [74, 74, 78]

let beatMap    = []
let beatIndex  = 0
let dots       = []
let running    = false
let freePlayMode = false
let currentLevel = 0

let score    = 0
let combo    = 0
let maxCombo = 0
let totalNotes = 0
let hitCount = 0
let missCount = 0
let failed = false

// Recording for free-play mode
let recordedBeats = []
let recordingStartTime = 0

// callbacks set by main
let onHit     = () => {}
let onMiss    = () => {}
let onScore   = () => {}
let onEnd     = () => {}
let onFail    = () => {}

export function initGame({ onHit: h, onMiss: m, onScore: s, onEnd: e, onFail: f }) {
  onHit   = h || onHit
  onMiss  = m || onMiss
  onScore = s || onScore
  onEnd   = e || onEnd
  onFail  = f || onFail
}

export function loadMap(map) {
  beatMap = map.notes
  totalNotes = map.notes.length
  freePlayMode = false
}

export function setFreePlayMode(enabled) {
  freePlayMode = enabled
  beatMap = []
  totalNotes = 0
}

export function setCurrentLevel(level) {
  currentLevel = level
}

export function getRecordedBeats() {
  return recordedBeats
}

export function loadRecordedBeats(beats) {
  beatMap = beats.map(b => ({ lane: b.lane, time: b.time }))
  totalNotes = beatMap.length
  freePlayMode = false
}

export function endFreePlay() {
  if (freePlayMode && running) {
    running = false
    console.log(`Recording ended with ${recordedBeats.length} beats`)
    onEnd(0, 0, 100)  // End with dummy stats
  }
}

export function startGame() {
  beatIndex = 0
  dots      = []
  score     = 0
  combo     = 0
  maxCombo  = 0
  hitCount  = 0
  missCount = 0
  failed    = false
  running   = true

  // Start recording in free-play mode
  if (freePlayMode) {
    recordedBeats = []
    recordingStartTime = songTime()
  }
}

export function stopGame() {
  running = false
}

export function isRunning() {
  return running
}

export function getDots() {
  return dots
}

export function getScore()    { return score }
export function getCombo()    { return combo }
export function getMaxCombo() { return maxCombo }
export function getAccuracy() {
  const total = hitCount + missCount
  return total === 0 ? 100 : (hitCount / total) * 100
}

export function setTravelTime(seconds) {
  TRAVEL_TIME = 0.5 
}


export function triggerLane(lane) {
  if (!running) return

  // In free-play mode, spawn a reverse dot on input and record the beat
  if (freePlayMode) {
    const wallNow = performance.now()
    const currentTime = songTime()

    // Record the beat (time relative to start)
    recordedBeats.push({
      lane: lane,
      time: currentTime - recordingStartTime
    })

    dots.push({
      lane:       lane,
      hitTime:    0,  // not used in free-play
      spawnWall:  wallNow,
      travelTime: 1.0,
      hit:        false,
      missed:     false,
      hitWall:    null,
      missWall:   null,
      reverse:    true,  // moves from endpoint to center
    })
    return
  }

  const now = songTime()
  let best = null, bestDelta = Infinity

  for (const dot of dots) {
    if (dot.lane !== lane || dot.hit || dot.missed) continue
    const delta = Math.abs(now - dot.hitTime)
    if (delta < HIT_WINDOW_GOOD && delta < bestDelta) {
      best = dot
      bestDelta = delta
    }
  }

  if (best) {
    best.hit     = true
    best.hitWall = performance.now()
    const grade  = bestDelta < HIT_WINDOW_PERFECT ? 'PERFECT' : 'GOOD'
    const pts    = grade === 'PERFECT' ? SCORE_PERFECT : SCORE_GOOD
    hitCount++
    combo++
    if (combo > maxCombo) maxCombo = combo
    const mult = Math.min(4, 1 + Math.floor(combo / 10))
    score += pts * mult
    onHit(lane, grade)
    onScore(score, combo, getAccuracy())
  }
}

export function update() {
  if (!running) return

  const now     = songTime()
  const wallNow = performance.now()

  // In free-play mode, just cull old dots
  if (freePlayMode) {
    // cull dots that have completed their travel
    dots = dots.filter(d => {
      const elapsed = (wallNow - d.spawnWall) / 1000
      return elapsed < d.travelTime + 0.5  // keep for a bit after reaching center
    })
    return
  }

  // spawn
  while (beatIndex < beatMap.length) {
    TRAVEL_TIME = 1.0
    const note = beatMap[beatIndex]
    if (note.time - now <= TRAVEL_TIME + 0.05) {
      dots.push({
        lane:       note.lane,
        hitTime:    note.time,
        spawnWall:  wallNow - (TRAVEL_TIME - (note.time - now)) * 1000,
        travelTime: TRAVEL_TIME,
        hit:        false,
        missed:     false,
        hitWall:    null,
        missWall:   null,
        reverse:    false,
      })
      beatIndex++
    } else break
  }

  // miss detection
  for (const dot of dots) {
    if (!dot.hit && !dot.missed && now > dot.hitTime + MISS_WINDOW) {
      dot.missed   = true
      dot.missWall = wallNow
      missCount++
      combo        = 0
      onMiss(dot.lane)
      onScore(score, combo, getAccuracy())

      // Check fail condition
      const accuracy = getAccuracy()
      if (accuracy < 0 && !failed && (hitCount >= 10 || missCount >= 10)) {
        failed = true
        running = false
        onFail(score, maxCombo, accuracy)
      }
    }
  }

  // cull dead dots
  dots = dots.filter(d => {
    if (d.hit)    return wallNow - d.hitWall  < 400
    if (d.missed) return wallNow - d.missWall < 600
    return true
  })

  // end condition - check if we've reached the level duration
  const levelDuration = LEVEL_DURATIONS[currentLevel] || 74
  if (now >= levelDuration && !failed) {
    running = false
    onEnd(score, maxCombo, getAccuracy())
  }
}