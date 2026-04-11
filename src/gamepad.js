// PS5 Standard Mapping Indices
const BUTTON_TRIANGLE = 3  // Lane 0 (J)
const BUTTON_CIRCLE   = 1  // Lane 1 (K)
const BUTTON_SQUARE   = 2  // Lane 2 (L)
const BUTTON_UP       = 12 // Lane 3 (D)
const BUTTON_LEFT     = 14 // Lane 4 (S)
const BUTTON_DOWN     = 13 // Lane 5 (A)

// Updated Map: Button indices to Lane numbers
const BUTTON_TO_LANE = {
  [BUTTON_TRIANGLE]: 0,
  [BUTTON_CIRCLE]:   1,
  [BUTTON_SQUARE]:   2,
  [BUTTON_UP]:       3,
  [BUTTON_LEFT]:     4,
  [BUTTON_DOWN]:     5,
}

let lastButtonStates = {}

export function initGamepad() {
  // Initialize button states for all gamepads
  const gamepads = navigator.getGamepads()
  for (let i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
      lastButtonStates[i] = new Array(gamepads[i].buttons.length).fill(false)
    }
  }
}

export function pollGamepads(onPress, onRelease) {
  const gamepads = navigator.getGamepads()

  for (let i = 0; i < gamepads.length; i++) {
    const gamepad = gamepads[i]
    if (!gamepad) continue

    // Initialize state for new gamepad
    if (!lastButtonStates[i]) {
      lastButtonStates[i] = new Array(gamepad.buttons.length).fill(false)
    }

    // Check each button we care about
    for (const [buttonIdx, lane] of Object.entries(BUTTON_TO_LANE)) {
      const button = gamepad.buttons[buttonIdx]
      const pressed = button?.pressed || false
      const wasPressed = lastButtonStates[i][buttonIdx] || false

      // Detect press (rising edge)
      if (pressed && !wasPressed) {
        onPress(lane)
      }

      // Detect release (falling edge)
      if (!pressed && wasPressed) {
        onRelease(lane)
      }

      lastButtonStates[i][buttonIdx] = pressed
    }
  }
}

export function getPressedLanes() {
  const pressed = new Set()
  const gamepads = navigator.getGamepads()

  for (let i = 0; i < gamepads.length; i++) {
    const gamepad = gamepads[i]
    if (!gamepad) continue

    for (const [buttonIdx, lane] of Object.entries(BUTTON_TO_LANE)) {
      if (gamepad.buttons[buttonIdx]?.pressed) {
        pressed.add(parseInt(lane))
      }
    }
  }

  return pressed
}

// Listen for gamepad connection events
window.addEventListener('gamepadconnected', (e) => {
  console.log('Gamepad connected:', e.gamepad.id)
  initGamepad()
})

window.addEventListener('gamepaddisconnected', (e) => {
  console.log('Gamepad disconnected:', e.gamepad.id)
  delete lastButtonStates[e.gamepad.index]
})
