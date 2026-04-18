#!/usr/bin/env node
/**
 * Encryption script for background images
 *
 * This script encrypts PNG/JPG images in the backgrounds folder using AES-GCM encryption.
 * The encrypted files are saved with .encrypted extension and can be committed to git.
 *
 * Usage: node encrypt-backgrounds.js
 *
 * You will be prompted for a password. Use the same password when running the game.
 */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const BACKGROUNDS_DIR = path.join(__dirname, 'assets', 'backgrounds')

// Create readline interface for password input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

function deriveKey(password, salt) {
  // Use PBKDF2 to derive a key from the password
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256')
}

function encryptFile(filePath, password) {
  const fileData = fs.readFileSync(filePath)

  // Generate random salt and IV
  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(12) // GCM standard IV size

  // Derive key from password
  const key = deriveKey(password, salt)

  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  // Encrypt the file
  const encrypted = Buffer.concat([cipher.update(fileData), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Combine salt, iv, authTag, and encrypted data
  // Format: [salt(16)][iv(12)][authTag(16)][encryptedData]
  const result = Buffer.concat([salt, iv, authTag, encrypted])

  return result
}

async function main() {
  console.log('=== Background Image Encryption Tool ===\n')

  // Check if backgrounds directory exists
  if (!fs.existsSync(BACKGROUNDS_DIR)) {
    console.error(`Error: Backgrounds directory not found: ${BACKGROUNDS_DIR}`)
    process.exit(1)
  }

  // Find all image files
  const files = fs.readdirSync(BACKGROUNDS_DIR)
    .filter(f => /\.(png|jpg|jpeg)$/i.test(f))

  if (files.length === 0) {
    console.log('No PNG/JPG files found in backgrounds directory.')
    rl.close()
    return
  }

  console.log('Found images to encrypt:')
  files.forEach(f => console.log(`  - ${f}`))
  console.log()

  // Get password (hidden input)
  const password = await question('Enter encryption password: ')

  if (!password || password.length < 4) {
    console.error('Password must be at least 4 characters long.')
    rl.close()
    process.exit(1)
  }

  const confirm = await question('Confirm password: ')

  if (password !== confirm) {
    console.error('Passwords do not match.')
    rl.close()
    process.exit(1)
  }

  console.log('\nEncrypting files...')

  // Encrypt each file
  for (const file of files) {
    const filePath = path.join(BACKGROUNDS_DIR, file)
    const outputPath = filePath + '.encrypted'

    try {
      const encrypted = encryptFile(filePath, password)
      fs.writeFileSync(outputPath, encrypted)
      console.log(`✓ Encrypted: ${file} -> ${file}.encrypted`)
    } catch (err) {
      console.error(`✗ Failed to encrypt ${file}:`, err.message)
    }
  }

  console.log('\nDone! Encrypted files saved with .encrypted extension.')
  console.log('Remember to use the same password when running the game.')

  rl.close()
}

main().catch(err => {
  console.error('Error:', err)
  rl.close()
  process.exit(1)
})
