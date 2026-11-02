// Makes every Whisk & Co. logo file from one design (the "dipped W" round sticker).
// Run from the client folder:  npm run logo   (needs internet once, to download the two fonts)
//
// It writes:
//   public/logo-full.svg        sticker with the name (for cream backgrounds)
//   public/logo-light.svg       the same for dark backgrounds (cream name, strawberry-rose W)
//   public/logo-mark.svg        just the round dipped-W icon (small spaces)
//   public/logo-mark-light.svg  the icon for dark backgrounds
//   public/favicon.svg, favicon.png, apple-touch-icon.png   browser tab and phone home screen
//   public/instagram-1080.png   1080 x 1080 profile picture for Instagram
//   src/components/logo/logoShapes.js   the same shapes for the website's own <LogoMark>
//
// The letters are turned into shapes (paths), so the files look the same everywhere,
// even where the Fraunces and Pinyon Script fonts are not installed.

import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'
import sharp from 'sharp'

const publicDir = fileURLToPath(new URL('../public/', import.meta.url))
const shapesFile = fileURLToPath(new URL('../src/components/logo/logoShapes.js', import.meta.url))

// ---------- Fonts (the exact styles the website uses) ----------
async function loadFont(family) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}`)).text()
  const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1]
  if (!url) throw new Error(`Could not find the font file for ${family}`)
  return opentype.parse(await (await fetch(url)).arrayBuffer())
}
const fraunces = await loadFont('Fraunces:opsz,wght,SOFT@144,900,100') // heavy, soft, display size
const pinyon = await loadFont('Pinyon+Script')

// ---------- Colours ----------
const COCOA = '#3b2420'
const CREAM = '#fbf4ef'
const ROSE = '#c97b7b'
const THEMES = {
  light: { disc: '#f6d6cf', chocTop: '#6b4038', chocBottom: COCOA, wire: '#9b8580', shine: 'rgba(251,244,239,0.55)', ink: COCOA },
  dark: { disc: '#4a2f2b', chocTop: '#e3a3a3', chocBottom: ROSE, wire: '#cdb8b1', shine: 'rgba(251,244,239,0.6)', ink: CREAM },
}

// ---------- The design, in a 300 x 300 box ----------
const round = (n) => Math.round(n * 10) / 10
const pt = ([x, y]) => `${round(x)} ${round(y)}`

// The big chocolate "W" (centred on x = 152, sitting on y = 212)
const W_SIZE = 150
const wGlyph = fraunces.charToGlyph('W')
const wX = 152 - (wGlyph.advanceWidth / fraunces.unitsPerEm) * W_SIZE / 2
const W_PATH = wGlyph.getPath(wX, 212, W_SIZE).toPathData(1)

// Whisk wires: all start from one handle point (outside the circle) and bulge out like a
// balloon whisk, then dip into the W. The last part of each wire is coated in chocolate.
const HANDLE = [-70, -60]
const WIRE_ENDS = [[94, 124], [104, 118], [114, 114], [124, 112], [134, 114]]
const BULGE = [-1, -0.5, 0, 0.5, 1]

// Split a curve at t (de Casteljau) and keep the end part: that's the chocolate coating
function lastPart([p0, p1, p2, p3], t) {
  const mix = (a, b) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  const a = mix(p0, p1), b = mix(p1, p2), c = mix(p2, p3)
  const d = mix(a, b), e = mix(b, c)
  return [mix(d, e), e, c, p3]
}
const curve = ([p0, p1, p2, p3]) => `M${pt(p0)} C${pt(p1)}, ${pt(p2)}, ${pt(p3)}`

const WIRES = WIRE_ENDS.map(([x, y], i) => {
  const dx = x - HANDLE[0], dy = y - HANDLE[1], len = Math.hypot(dx, dy)
  const k = BULGE[i] * 46
  const px = (-dy / len) * k, py = (dx / len) * k
  const points = [HANDLE, [HANDLE[0] + dx * 0.45 + px, HANDLE[1] + dy * 0.45 + py], [x - dx * 0.18 + px * 0.7, y - dy * 0.18 + py * 0.7], [x, y]]
  return { wire: curve(points), coat: curve(lastPart(points, 0.72)) }
})

// Chocolate drips under the W, and a little shine on its right arm
const DRIPS = [[127, 208, 34], [180, 206, 22]].map(([x, y, l]) => ({
  d: `M${x - 5} ${y - 8} C${x - 4} ${round(y + l * 0.4)}, ${x - 3} ${y + l - 5}, ${x} ${y + l} C${x + 3} ${y + l - 5}, ${x + 4} ${round(y + l * 0.4)}, ${x + 5} ${y - 8} Z`,
  bulb: { cx: x, cy: y + l - 2.5, r: 4 },
}))
const SHINE = 'M196 122 q4 18 -2 40'

// Where the W group sits: alone (icon) or above the name (full sticker)
const MARK_TRANSFORM = 'translate(150 154) scale(1.08) translate(-152 -172)'
const FULL_TRANSFORM = 'translate(18 2) scale(0.88)'

// "Whisk & Co." under the W in the full sticker, centred
function nameShapes(ink) {
  const size = 30, ampSize = 42, y = 256
  const parts = [[fraunces, 'Whisk ', size, ink], [pinyon, '&', ampSize, ROSE], [fraunces, ' Co.', size, ink]]
  const total = parts.reduce((sum, [font, text, s]) => sum + font.getAdvanceWidth(text, s), 0)
  let x = 150 - total / 2
  return parts.map(([font, text, s, fill]) => {
    const d = font.getPath(text, x, y, s).toPathData(1)
    x += font.getAdvanceWidth(text, s)
    return `<path d="${d}" fill="${fill}"/>`
  }).join('')
}

// ---------- SVG files ----------
function svg(theme, withName) {
  const t = THEMES[theme]
  const parts = `
    <path d="${W_PATH}" fill="url(#choc)"/>
    ${DRIPS.map(({ d, bulb }) => `<path d="${d}" fill="url(#choc)"/><circle cx="${bulb.cx}" cy="${bulb.cy}" r="${bulb.r}" fill="url(#choc)"/>`).join('')}
    <g fill="none" stroke-linecap="round">
      ${WIRES.map(({ wire }) => `<path d="${wire}" stroke="${t.wire}" stroke-width="2.2"/>`).join('')}
      ${WIRES.map(({ coat }) => `<path d="${coat}" stroke="url(#choc)" stroke-width="5"/>`).join('')}
      <path d="${SHINE}" stroke="${t.shine}" stroke-width="3"/>
    </g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
  <title>Whisk &amp; Co.</title>
  <defs>
    <linearGradient id="choc" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="0" y2="250">
      <stop offset="0" stop-color="${t.chocTop}"/><stop offset="1" stop-color="${t.chocBottom}"/>
    </linearGradient>
    <clipPath id="disc"><circle cx="150" cy="150" r="140"/></clipPath>
  </defs>
  <circle cx="150" cy="150" r="140" fill="${t.disc}"/>
  <g clip-path="url(#disc)"><g transform="${withName ? FULL_TRANSFORM : MARK_TRANSFORM}">${parts}</g></g>
  ${withName ? nameShapes(t.ink) : ''}
</svg>
`
}

const files = {
  'logo-full.svg': svg('light', true),
  'logo-light.svg': svg('dark', true),
  'logo-mark.svg': svg('light', false),
  'logo-mark-light.svg': svg('dark', false),
  'favicon.svg': svg('light', false),
}
for (const [name, content] of Object.entries(files)) await writeFile(`${publicDir}${name}`, content)

// ---------- PNG files ----------
const png = (content, size) => sharp(Buffer.from(content), { density: 72 * (size / 300) * 2 }).resize(size, size)
await png(files['logo-mark.svg'], 48).png().toFile(`${publicDir}favicon.png`)
// phone home screen: the icon on cream (phones don't like see-through icons)
await png(files['logo-mark.svg'], 180).flatten({ background: CREAM }).png().toFile(`${publicDir}apple-touch-icon.png`)
// Instagram crops profile pictures to a circle, so the round sticker fills the square
await png(files['logo-full.svg'], 1080).flatten({ background: CREAM }).png().toFile(`${publicDir}instagram-1080.png`)

// ---------- Shapes for the website's <LogoMark> ----------
await mkdir(fileURLToPath(new URL('../src/components/logo/', import.meta.url)), { recursive: true })
await writeFile(
  shapesFile,
  `// Made by scripts/make-logo.mjs (npm run logo). Don't edit by hand: change the script and run it again.
// The shapes of the "dipped W" logo in a 300 x 300 box; the colours come from CSS (see LogoMark.css).

export const MARK_TRANSFORM = '${MARK_TRANSFORM}'
export const W_PATH = '${W_PATH}'
export const WIRES = ${JSON.stringify(WIRES, null, 2)}
export const DRIPS = ${JSON.stringify(DRIPS, null, 2)}
export const SHINE = '${SHINE}'
`,
)

console.log('Done! Logo SVGs, favicons and instagram-1080.png are in public/, and src/components/logo/logoShapes.js is updated.')
