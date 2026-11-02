// Makes public/og-image.png: the picture shown when a link to the website is shared
// on WhatsApp, Instagram, Facebook… (1200 × 630 is the size they all expect).
// If logo.png is in the project root folder it is added; otherwise it's text only.
// Run from the client folder:  npm run share-image   (npm run favicon runs it too)

import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const logoPath = fileURLToPath(new URL('../../logo.png', import.meta.url))
const output = fileURLToPath(new URL('../public/og-image.png', import.meta.url))

const WIDTH = 1200
const HEIGHT = 630
const hasLogo = await access(logoPath).then(
  () => true,
  () => false,
)

// The brand colours from src/index.css
const espresso = '#2b1a14'
const cream = '#f6efe5'
const rose = '#eeb5b0'
const gold = '#c49a5c'

// With a logo, the text moves down to make room for it
const top = hasLogo ? 360 : 250

const background = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${espresso}"/>
  <circle cx="1080" cy="80" r="220" fill="${rose}" opacity="0.12"/>
  <circle cx="110" cy="590" r="180" fill="${gold}" opacity="0.12"/>
  <rect x="40" y="40" width="${WIDTH - 80}" height="${HEIGHT - 80}" rx="28" fill="none" stroke="${gold}" stroke-opacity="0.45" stroke-width="2"/>
  <text x="50%" y="${top}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="84" letter-spacing="6" fill="${cream}">PASTEL N POSTERY</text>
  <text x="50%" y="${top + 70}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="44" fill="${rose}">home bakery</text>
  <text x="50%" y="${top + 150}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="${cream}" fill-opacity="0.85">Fresh cakes, cupcakes, breads &amp; cookies · Preorder online</text>
</svg>`

const layers = []
if (hasLogo) {
  // The logo in a cream circle at the top
  const size = 200
  const circle = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${cream}"/></svg>`)
  const logo = await sharp(logoPath).resize(150, 150, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  const badge = await sharp(circle).composite([{ input: logo, gravity: 'center' }]).png().toBuffer()
  layers.push({ input: badge, top: 70, left: (WIDTH - size) / 2 })
}

await sharp(Buffer.from(background)).composite(layers).png({ compressionLevel: 9, palette: true }).toFile(output)
console.log(`Done! Created public/og-image.png (${hasLogo ? 'with your logo' : 'text only: add logo.png and run again'})`)
