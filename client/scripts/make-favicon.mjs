// Makes the website logo and favicons from logo.png in the project root folder.
// Run from the client folder:  npm run favicon

import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const source = fileURLToPath(new URL('../../logo.png', import.meta.url))
const publicDir = fileURLToPath(new URL('../public/', import.meta.url))

try {
  await access(source)
} catch {
  console.error('Could not find logo.png. Put your logo in the project root folder (next to client/) and try again.')
  process.exit(1)
}

const transparent = { r: 0, g: 0, b: 0, alpha: 0 }
const cream = { r: 246, g: 239, b: 229, alpha: 1 }

// Logo used on the website (max 512px wide so it loads fast)
await sharp(source).resize({ width: 512, withoutEnlargement: true }).png().toFile(`${publicDir}logo.png`)

// Small icon shown in the browser tab
await sharp(source).resize(48, 48, { fit: 'contain', background: transparent }).png().toFile(`${publicDir}favicon.png`)

// Icon used when someone adds the site to their phone home screen
await sharp(source)
  .resize(180, 180, { fit: 'contain', background: cream })
  .flatten({ background: cream })
  .png()
  .toFile(`${publicDir}apple-touch-icon.png`)

console.log('Done! Created public/logo.png, public/favicon.png and public/apple-touch-icon.png')
