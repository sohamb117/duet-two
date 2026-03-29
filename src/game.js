import { songTime } from './audio.js'

const TRAVEL_TIME       = 1.4
const HIT_WINDOW_PERFECT = 0.060
const HIT_WINDOW_GOOD    = 0.120
const MISS_WINDOW        = 0.150

const SCORE_PERFECT = 300
const SCORE_GOOD    = 100

let beatMap    = []
let beatIndex  = 0
let dots       = []
let running    = false

let score    = 0
let combo    = 0
let maxCombo = 0

// callbacks set by main
let onHit     = () => {}
let onMiss    = () => {}
let onScore   = () => {}
let onEnd     = () => {}

export function initGame({ onHit: h, onMiss: m, onScore: s, onEnd: e }) {
  onHit   = h || onHit
  onMiss  = m || onMiss
  onScore = s || onScore
  onEnd   = e || onEnd
}

export function loadMap(map) {
  beatMap = map.notes
}

export function startGame() {
  beatIndex = 0
  dots      = []
  score     = 0
  combo     = 0
  maxCombo  = 0
  running   = true
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

export function triggerLane(lane) {
  if (!running) return

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
    combo++
    if (combo > maxCombo) maxCombo = combo
    const mult = Math.min(4, 1 + Math.floor(combo / 10))
    score += pts * mult
    onHit(lane, grade)
    onScore(score, combo)
  }
}

export function update() {
  if (!running) return

  const now     = songTime()
  const wallNow = performance.now()

  // spawn
  while (beatIndex < beatMap.length) {
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
      })
      beatIndex++
    } else break
  }

  // miss detection
  for (const dot of dots) {
    if (!dot.hit && !dot.missed && now > dot.hitTime + MISS_WINDOW) {
      dot.missed   = true
      dot.missWall = wallNow
      combo        = 0
      onMiss(dot.lane)
      onScore(score, combo)
    }
  }

  // cull dead dots
  dots = dots.filter(d => {
    if (d.hit)    return wallNow - d.hitWall  < 400
    if (d.missed) return wallNow - d.missWall < 600
    return true
  })

  // end condition
  if (beatIndex >= beatMap.length && dots.length === 0) {
    running = false
    onEnd(score, maxCombo)
  }
}