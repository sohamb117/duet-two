const NUM_LANES   = 6
const CENTER      = { x: 400, y: 400 }
const HIT_RADIUS  = 280
const SPAWN_RADIUS= 12
const LANE_COLORS = ['#000000','#000000','#000000','#000000','#000000','#000000']

let canvas = null
let ctx    = null



export function initRenderer() {
  canvas = document.getElementById('game-canvas')
  ctx    = canvas.getContext('2d')

  // fill once so partial clear has something to blend against
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

export function laneAngle(lane) {
  return (lane / NUM_LANES) * Math.PI * 2 - Math.PI / 2
}

export function lanePos(lane) {
  const a = laneAngle(lane)
  return {
    x: CENTER.x + Math.cos(a) * HIT_RADIUS,
    y: CENTER.y + Math.sin(a) * HIT_RADIUS
  }
}

export function clearFrame(playing) {
  if (playing) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  } else {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
}
export function drawStatic() {
  // hit ring
  ctx.beginPath()
  ctx.arc(CENTER.x, CENTER.y, HIT_RADIUS, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'
  ctx.lineWidth   = 1.5
  ctx.stroke()

  // inner ring
  ctx.beginPath()
  ctx.arc(CENTER.x, CENTER.y, 32, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'
  ctx.lineWidth   = 1
  ctx.stroke()

  // lane lines
  for (let i = 0; i < NUM_LANES; i++) {
    const a = laneAngle(i)
    ctx.beginPath()
    ctx.moveTo(CENTER.x + Math.cos(a) * 34,               CENTER.y + Math.sin(a) * 34)
    ctx.lineTo(CENTER.x + Math.cos(a) * (HIT_RADIUS - 28), CENTER.y + Math.sin(a) * (HIT_RADIUS - 28))
    ctx.strokeStyle = LANE_COLORS[i] + '18'
    ctx.lineWidth   = 1
    ctx.stroke()
  }
}

export function drawButtons(pressedLanes = new Set()) {
  for (let i = 0; i < NUM_LANES; i++) {
    const { x, y } = lanePos(i)
    const color     = LANE_COLORS[i]
    const pressed   = pressedLanes.has(i)

    // glow behind button when pressed
    if (pressed) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 36)
      glow.addColorStop(0, color + '88')
      glow.addColorStop(1, color + '00')
      ctx.beginPath()
      ctx.arc(x, y, 36, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()
      ctx.restore()
    }

    // button ring
    ctx.beginPath()
    ctx.arc(x, y, 22, 0, Math.PI * 2)
    ctx.strokeStyle = pressed ? color : color + '66'
    ctx.lineWidth   = pressed ? 2.5 : 1.5
    ctx.stroke()

    // fill when pressed
    if (pressed) {
      ctx.beginPath()
      ctx.arc(x, y, 22, 0, Math.PI * 2)
      ctx.fillStyle = color + '33'
      ctx.fill()
    }
  }
}

export function drawNote(dot, wallNow) {
  const elapsed  = (wallNow - dot.spawnWall) / 1000
  const progress = elapsed / dot.travelTime
  const r        = SPAWN_RADIUS + (HIT_RADIUS - SPAWN_RADIUS) * Math.min(progress, 1.0)
  const a        = laneAngle(dot.lane)
  const x        = CENTER.x + Math.cos(a) * r
  const y        = CENTER.y + Math.sin(a) * r
  const color    = LANE_COLORS[dot.lane]

  if (dot.hit) {
    drawHitBurst(x, y, color, (wallNow - dot.hitWall) / 350)
    return
  }

  if (dot.missed) {
    const t = (wallNow - dot.missWall) / 500
    ctx.globalAlpha = Math.max(0, 1 - t)
    drawDot(x, y, '#aaa', 9)
    ctx.globalAlpha = 1
    return
  }

  // glow
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  const nearness = Math.max(0, progress - 0.7) / 0.3
  const glowR    = 24 + nearness * 10
  const grad     = ctx.createRadialGradient(x, y, 0, x, y, glowR)
  grad.addColorStop(0, color + '99')
  grad.addColorStop(1, color + '00')
  ctx.beginPath()
  ctx.arc(x, y, glowR, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.restore()

  // core dot
  drawDot(x, y, color, 9 + nearness * 3)
}

function drawDot(x, y, color, size) {
  ctx.beginPath()
  ctx.arc(x, y, size, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  ctx.beginPath()
  ctx.arc(x, y, size * 0.38, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fill()
}

function drawHitBurst(x, y, color, t) {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 3; i++) {
    const rt    = Math.min(1, t + i * 0.1)
    const r     = 14 + rt * 44
    const alpha = Math.max(0, 1 - rt * 1.3)
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.strokeStyle = color
    ctx.globalAlpha = alpha
    ctx.lineWidth   = Math.max(0.1, 2.5 - rt * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.restore()
}