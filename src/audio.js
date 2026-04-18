let audioCtx    = null
let audioBuffer = null
let audioSource = null
let songGain    = null
let startTime   = 0
let offset      = 0

// Hit sound buffers for each lane
let hitSoundBuffers = [null, null, null, null, null, null]

export function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)()
}

export async function loadAudio(arrayBuffer) {
  if (!audioCtx) initAudio()
  audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
}

export async function loadHitSound(lane, arrayBuffer) {
  if (!audioCtx) initAudio()
  hitSoundBuffers[lane] = await audioCtx.decodeAudioData(arrayBuffer)
}

export function play() {
  if (!audioCtx || !audioBuffer) return
  if (audioCtx.state === 'suspended') audioCtx.resume()

  audioSource = audioCtx.createBufferSource()
  audioSource.buffer = audioBuffer

  // Create gain node to control song volume
  songGain = audioCtx.createGain()
  songGain.gain.value = 0.2  // Default volume

  audioSource.connect(songGain)
  songGain.connect(audioCtx.destination)
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

export function setVolume(volume) {
  if (songGain) {
    songGain.gain.value = volume
  }
}

export function getAudioDuration() {
  return audioBuffer ? audioBuffer.duration : 0
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

  // If we have a loaded MP3 for this lane, play it
  if (hitSoundBuffers[lane]) {
    const source = audioCtx.createBufferSource()
    const gain = audioCtx.createGain()

    source.buffer = hitSoundBuffers[lane]
    source.connect(gain)
    gain.connect(audioCtx.destination)

    gain.gain.value = 0.9  // Volume control
    source.start(0)
    return
  }

  // Fallback to oscillator if no MP3 is loaded
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