async function deriveKey(password, salt) {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // Import password as raw key material
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  )

  // Derive the actual encryption key
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
}

/**
 * Decrypt an encrypted file buffer
 * @param {ArrayBuffer} encryptedData - Encrypted file data
 * @param {string} password - Decryption password
 * @returns {Promise<ArrayBuffer>} Decrypted data
 */
export async function decryptFile(encryptedData, password) {
  const data = new Uint8Array(encryptedData)

  // Extract components: [salt(16)][iv(12)][authTag(16)][encryptedData]
  const salt = data.slice(0, 16)
  const iv = data.slice(16, 28)
  const authTag = data.slice(28, 44)
  const encrypted = data.slice(44)

  // Derive key from password
  const key = await deriveKey(password, salt)

  // Combine encrypted data and auth tag for decryption
  const ciphertext = new Uint8Array(encrypted.length + authTag.length)
  ciphertext.set(encrypted)
  ciphertext.set(authTag, encrypted.length)

  try {
    // Decrypt the data
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      key,
      ciphertext
    )

    return decrypted
  } catch (err) {
    throw new Error('Decryption failed. Incorrect password or corrupted file.')
  }
}

/**
 * Load and decrypt a background image
 * @param {string} filename - Name of encrypted file (e.g., 'natalia_bg.png.encrypted')
 * @param {string} password - Decryption password
 * @returns {Promise<string>} Data URL of decrypted image
 */
export async function loadEncryptedBackground(filename, password) {
  try {
    // Fetch encrypted file
    const response = await fetch(`assets/backgrounds/${filename}`)
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}`)
    }

    const encryptedData = await response.arrayBuffer()

    // Decrypt the data
    const decryptedData = await decryptFile(encryptedData, password)

    // Determine MIME type from original filename
    const originalName = filename.replace('.encrypted', '')
    let mimeType = 'image/png'
    if (/\.jpe?g$/i.test(originalName)) {
      mimeType = 'image/jpeg'
    }

    // Convert to blob and create object URL
    const blob = new Blob([decryptedData], { type: mimeType })
    return URL.createObjectURL(blob)
  } catch (err) {
    console.error(`Error loading encrypted background ${filename}:`, err)
    throw err
  }
}

/**
 * Load all encrypted backgrounds in the backgrounds folder
 * @param {string} password - Decryption password
 * @returns {Promise<Object>} Map of background names to data URLs
 */
export async function loadAllBackgrounds(password) {
  // List of encrypted backgrounds
  const backgrounds = [
    'natalia_bg.png.encrypted',
    'tally_bg.png.encrypted'
  ]

  const results = {}

  for (const filename of backgrounds) {
    try {
      const dataUrl = await loadEncryptedBackground(filename, password)
      const name = filename.replace('.png.encrypted', '').replace('.jpg.encrypted', '')
      results[name] = dataUrl
      console.log(`✓ Loaded background: ${name}`)
    } catch (err) {
      console.error(`✗ Failed to load background ${filename}:`, err.message)
      throw err
    }
  }

  return results
}
