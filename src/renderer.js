const NUM_LANES   = 6
const CENTER      = { x: 400, y: 400 }
const HIT_RADIUS  = 280
const SPAWN_RADIUS= 12
const LANE_COLORS = ['#AA0000','#AAAA00','#00AA00','#00AAAA','#0000AA','#AA00AA']

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

const X_RADIUS = 340   // wider horizontally
const Y_RADIUS = 200   // shorter vertically

export function lanePos(lane) {
  // 3 buttons on each side in offset columns
  // Left side: lanes 5,4,3 (A,S,D) | Right side: lanes 0,1,2 (J,K,L)

  const positions = {
    // Right side (offset columns)
    0: { x: CENTER.x + 320, y: CENTER.y - 140 },  // J - top right (inset)
    1: { x: CENTER.x + 360, y: CENTER.y       },  // K - middle right (outset)
    2: { x: CENTER.x + 320, y: CENTER.y + 140 },  // L - bottom right (inset)

    // Left side (offset columns)
    3: { x: CENTER.x - 320, y: CENTER.y + 140 },  // D - bottom left (inset)
    4: { x: CENTER.x - 360, y: CENTER.y       },  // S - middle left (outset)
    5: { x: CENTER.x - 320, y: CENTER.y - 140 },  // A - top left (inset)
  }

  return positions[lane]
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
  // hit ring — ellipse instead of circle
  ctx.beginPath()
  ctx.ellipse(CENTER.x, CENTER.y, X_RADIUS, Y_RADIUS, 0, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth   = 1.5
  ctx.stroke()

  // inner ring
  ctx.beginPath()
  ctx.ellipse(CENTER.x, CENTER.y, 32, 20, 0, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,255,231,0.15)'
  ctx.lineWidth   = 1
  ctx.stroke()

  // lane lines
  for (let i = 0; i < NUM_LANES; i++) {
    const a  = laneAngle(i)
    const x0 = CENTER.x + Math.cos(a) * 34
    const y0 = CENTER.y + Math.sin(a) * 20
    const { x: x1, y: y1 } = lanePos(i)
    // shorten the line so it doesn't overlap the button
    const dx = x1 - x0, dy = y1 - y0
    const len = Math.sqrt(dx*dx + dy*dy)
    const nx = dx/len, ny = dy/len
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1 - nx*28, y1 - ny*28)
    ctx.strokeStyle = LANE_COLORS[i] + '18'
    ctx.lineWidth   = 1
    ctx.stroke()
  }
}

const LANE_KEYS = ['J','K','L','D','S','A']

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

    ctx.font         = '11px "Share Tech Mono", monospace'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle    = pressed ? color : color + '99'
    ctx.fillText(LANE_KEYS[i], x, y)
  }
}

export function drawNote(dot, wallNow) {
  const elapsed  = (wallNow - dot.spawnWall) / 1000
  const progress = elapsed / dot.travelTime

  // Get target button position
  const targetPos = lanePos(dot.lane)

  // Linear interpolation from center to button position
  const t = Math.min(progress, 1.0)
  const x = CENTER.x + (targetPos.x - CENTER.x) * t
  const y = CENTER.y + (targetPos.y - CENTER.y) * t

  const color = LANE_COLORS[dot.lane]

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