// Makes public/og-image.png: the picture shown when a link to the website is shared
// on WhatsApp, Instagram, Facebook… (1200 × 630 is the size they all expect).
// It uses public/logo-light.svg (made by npm run logo); without it, it's text only.
// Run from the client folder:  npm run share-image   (npm run logo runs it too)

import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const logoPath = fileURLToPath(new URL('../public/logo-light.svg', import.meta.url))
const output = fileURLToPath(new URL('../public/og-image.png', import.meta.url))

const WIDTH = 1200
const HEIGHT = 630
const hasLogo = await access(logoPath).then(
  () => true,
  () => false,
)

// The brand colours from src/index.css
const cocoa = '#3b2420'
const cream = '#fbf4ef'
const blush = '#f6d6cf'
const rose = '#c97b7b'

// With the logo, it sits on the left and the text moves to the right
const textX = hasLogo ? 560 : WIDTH / 2
const anchor = hasLogo ? 'start' : 'middle'

const background = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${cocoa}"/>
  <circle cx="1080" cy="80" r="220" fill="${blush}" opacity="0.1"/>
  <circle cx="110" cy="590" r="180" fill="${rose}" opacity="0.12"/>
  <rect x="40" y="40" width="${WIDTH - 80}" height="${HEIGHT - 80}" rx="28" fill="none" stroke="${rose}" stroke-opacity="0.45" stroke-width="2"/>
  <text x="${textX}" y="270" text-anchor="${anchor}" font-family="Georgia, 'Times New Roman', serif" font-weight="bold" font-size="76" fill="${cream}">Whisk &amp; Co.</text>
  <text x="${textX}" y="335" text-anchor="${anchor}" font-family="Georgia, serif" font-style="italic" font-size="44" fill="${blush}">home bakery · baked with love</text>
  <text x="${textX}" y="410" text-anchor="${anchor}" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="${cream}" fill-opacity="0.85">Fresh cakes, cupcakes, breads &amp; cookies</text>
  <text x="${textX}" y="450" text-anchor="${anchor}" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="${cream}" fill-opacity="0.85">Preorder online or on WhatsApp</text>
</svg>`

const layers = []
if (hasLogo) {
  // the round logo (cream version, for this dark background) on the left
  const logo = await sharp(logoPath, { density: 144 }).resize(400, 400).png().toBuffer()
  layers.push({ input: logo, top: (HEIGHT - 400) / 2, left: 110 })
}

await sharp(Buffer.from(background)).composite(layers).png({ compressionLevel: 9, palette: true }).toFile(output)
console.log(`Done! Created public/og-image.png (${hasLogo ? 'with the logo' : 'text only: run npm run logo first'})`)
