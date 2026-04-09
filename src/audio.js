let audioCtx    = null
let audioBuffer = null
let audioSource = null
let startTime   = 0
let offset      = 0

export function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)()
}

export async function loadAudio(arrayBuffer) {
  if (!audioCtx) initAudio()
  audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
}

export function play() {
  if (!audioCtx || !audioBuffer) return
  if (audioCtx.state === 'suspended') audioCtx.resume()

  audioSource = audioCtx.createBufferSource()
  audioSource.buffer = audioBuffer
  audioSource.connect(audioCtx.destination)
  audioSource.start(0)
  startTime = audioCtx.currentTime
}

export function stop() {
  if (!audioSource) return
  try { audioSource.stop() } catch(e) {}
  audioSource = null
}

export function songTime() {
  if (!audioCtx || !startTime) return 0
  return (audioCtx.currentTime - startTime) + offset
}

export function setOffset(ms) {
  offset = ms / 1000
}

export function isReady() {
  return audioBuffer !== null
}

const HIT_SOUNDS = [
  { freq: 440, type: 'sine' },
  { freq: 500, type: 'sine' },
  { freq: 560, type: 'sine' },
  { freq: 620, type: 'sine' },
  { freq: 680, type: 'sine' },
  { freq: 740, type: 'sine' },
]

export function playHitSound(lane) {
  if (!audioCtx) return
  const { freq, type } = HIT_SOUNDS[lane]

  const osc  = audioCtx.createOscillator()
  const gain = audioCtx.createGain()

  osc.connect(gain)
  gain.connect(audioCtx.destination)

  osc.type            = type
  osc.frequency.value = freq

  const t = audioCtx.currentTime
  gain.gain.setValueAtTime(0.25, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)

  osc.start(t)
  osc.stop(t + 0.08)
}