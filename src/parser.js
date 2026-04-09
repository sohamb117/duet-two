export function parseOsu(content) {
  const lines  = content.split(/\r?\n/)
  const result = { title: '', artist: '', audioFilename: '', notes: [] }
  let section  = ''

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('//')) continue

    if (line.startsWith('[') && line.endsWith(']')) {
      section = line.slice(1, -1)
      continue
    }

    if (section === 'General' || section === 'Metadata') {
      const colon = line.indexOf(':')
      if (colon === -1) continue
      const key = line.slice(0, colon).trim()
      const val = line.slice(colon + 1).trim()
      if (key === 'AudioFilename') result.audioFilename = val
      if (key === 'Title')         result.title         = val
      if (key === 'Artist')        result.artist        = val
    }

    if (section === 'HitObjects') {
      const parts = line.split(',')
      if (parts.length < 5) continue
      const x    = parseInt(parts[0])
      const time = parseFloat(parts[2]) / 1000
      const lane = Math.min(5, Math.round(x * 6 / 512))
      result.notes.push({ time, lane })
    }
  }

  result.notes.sort((a, b) => a.time - b.time)
  return result
}