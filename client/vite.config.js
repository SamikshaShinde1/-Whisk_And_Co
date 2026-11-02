import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Puts the website's full address into index.html wherever it says %SITE_URL%.
// WhatsApp and Instagram need a full address (https://…) for the link preview picture.
function siteUrl(url) {
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', url),
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd())
  const url = (env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, '')

  if (command === 'build' && !env.VITE_SITE_URL) {
    console.warn('\n⚠ VITE_SITE_URL is not set, so shared links will have no preview picture. Set it on Vercel.\n')
  }

  return {
    plugins: [react(), siteUrl(url)],
  }
})
