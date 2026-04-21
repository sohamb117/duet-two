const NUM_LANES   = 6
const CENTER      = { x: 400, y: 400 }
const HIT_RADIUS  = 280
const SPAWN_RADIUS= 12
const LANE_COLORS = ['#FF0000','#FFFF00','#00FF00','#99FFFF','#0099FF','#FF00FF']

let canvas = null
let ctx    = null



export function initRenderer() {
  canvas = document.getElementById('game-canvas')
  ctx    = canvas.getContext('2d', { alpha: true })
}

export function laneAngle(lane) {
  return (lane / NUM_LANES) * Math.PI * 2 - Math.PI / 2
}

const X_RADIUS = 340   // wider horizontally
const Y_RADIUS = 200   // shorter vertically

export function lanePos(lane) {
  // 6 buttons arranged in cardinal and intercardinal directions
  const radius = 340

  const positions = {
    0: { x: CENTER.x + radius * 0.707, y: CENTER.y - radius * 0.707 },  // J - Northeast
    1: { x: CENTER.x + radius,       y: CENTER.y },          // K - East
    2: { x: CENTER.x,                y: CENTER.y + radius },  // L - South
    3: { x: CENTER.x,                y: CENTER.y - radius },  // D - North
    4: { x: CENTER.x - radius * 0.707, y: CENTER.y - radius * 0.707 },  // S - Northwest
    5: { x: CENTER.x - radius,       y: CENTER.y },          // A - West
  }

  return positions[lane]
}

export function clearFrame(playing) {
  // Clear the canvas to show the CSS background
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Add a subtle black overlay during gameplay for trail effect
  if (playing) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
}
export function drawStatic() {
  // hit ring — circle
  ctx.beginPath()
  ctx.arc(CENTER.x, CENTER.y, 280, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.lineWidth   = 1.5
  ctx.stroke()

  // inner ring
  ctx.beginPath()
  ctx.arc(CENTER.x, CENTER.y, 28, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,255,231,0.4)'
  ctx.lineWidth   = 1
  ctx.stroke()

  // lane lines - draw from center circle to buttons
  for (let i = 0; i < NUM_LANES; i++) {
    const { x: x1, y: y1 } = lanePos(i)
    // Calculate direction from center to button
    const dx = x1 - CENTER.x
    const dy = y1 - CENTER.y
    const len = Math.sqrt(dx*dx + dy*dy)
    const nx = dx/len
    const ny = dy/len

    // Start at edge of inner circle
    const x0 = CENTER.x + nx * 30
    const y0 = CENTER.y + ny * 30

    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1 - nx*28, y1 - ny*28)
    ctx.strokeStyle = LANE_COLORS[i] + '40'
    ctx.lineWidth   = 1
    ctx.stroke()
  }
}

const LANE_KEYS = ['J','K','L','A','S','D']

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
    ctx.strokeStyle = pressed ? color : color + 'AA'
    ctx.lineWidth   = pressed ? 2.5 : 1.5
    ctx.stroke()

    // fill when pressed
    if (pressed) {
      ctx.beginPath()
      ctx.arc(x, y, 22, 0, Math.PI * 2)
      ctx.fillStyle = color + '33'
      ctx.fill()
    }

    ctx.font         = '11px "Share Tech Mono", monospace'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle    = pressed ? color : color + 'DD'
    ctx.fillText(LANE_KEYS[i], x, y)
  }
}

export function drawNote(dot, wallNow) {
  const elapsed  = (wallNow - dot.spawnWall) / 1000
  const progress = elapsed / dot.travelTime

  // Get target button position
  const targetPos = lanePos(dot.lane)

  // Linear interpolation - reverse if dot.reverse is true
  const t = Math.min(progress, 1.0)
  let x, y
  if (dot.reverse) {
    // Move from button position to center
    x = targetPos.x + (CENTER.x - targetPos.x) * t
    y = targetPos.y + (CENTER.y - targetPos.y) * t
  } else {
    // Move from center to button position (normal)
    x = CENTER.x + (targetPos.x - CENTER.x) * t
    y = CENTER.y + (targetPos.y - CENTER.y) * t
  }

  const color = LANE_COLORS[dot.lane]

  if (dot.hit) {
    drawHitBurst(x, y, color, (wallNow - dot.hitWall) / 350)
    return
  }

  if (dot.missed) {
    const t = (wallNow - dot.missWall) / 500
    ctx.globalAlpha = Math.max(0, 1 - t)
    drawDot(x, y, '#888', 9)
    ctx.globalAlpha = 1
    return
  }

  // reactive circle - centered at origin, dot sits on the edge
  drawReactiveCircle(x, y, color)

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

function drawReactiveCircle(dotX, dotY, color) {
  // Calculate distance from center to dot position
  const dx = dotX - CENTER.x
  const dy = dotY - CENTER.y
  const radius = Math.sqrt(dx * dx + dy * dy)

  // Draw circle centered at origin with radius equal to distance
  ctx.save()
  ctx.beginPath()
  ctx.arc(CENTER.x, CENTER.y, radius, 0, Math.PI * 2)
  ctx.strokeStyle = color + '60'  // Brighter for dark theme
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()
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