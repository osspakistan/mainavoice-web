import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Preload the hashed entry chunks and make the main stylesheet non-blocking.
 *
 * Critical above-the-fold CSS is inlined in `index.html`, so the full
 * stylesheet does not need to block first paint. We swap it to a
 * `media="print"` + `onload` pattern (with a `<noscript>` fallback) and add
 * `preload`/`modulepreload` hints so both assets still download immediately.
 */
function assetLoadingOptimizations(): Plugin {
  return {
    name: 'asset-loading-optimizations',
    transformIndexHtml(html, ctx) {
      const bundle = (ctx as { bundle?: Record<string, { type: string, fileName: string, isEntry?: boolean }> }).bundle
      if (!bundle)
        return html

      const cssFiles: string[] = []
      const jsEntries: string[] = []
      for (const [name, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'asset' && name.endsWith('.css'))
          cssFiles.push(chunk.fileName)
        if (chunk.type === 'chunk' && chunk.isEntry && chunk.fileName.endsWith('.js'))
          jsEntries.push(chunk.fileName)
      }

      let out = html

      // Make each emitted stylesheet non-blocking.
      for (const file of cssFiles) {
        const blocking = new RegExp(`<link[^>]*rel="stylesheet"[^>]*href="/${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`)
        out = out.replace(
          blocking,
          `<link rel="stylesheet" crossorigin href="/${file}" media="print" onload="this.media='all';this.onload=null">`
          + `<noscript><link rel="stylesheet" crossorigin href="/${file}"></noscript>`,
        )
      }

      const hints = [
        ...cssFiles.map(f => `<link rel="preload" as="style" href="/${f}">`),
        ...jsEntries.map(f => `<link rel="modulepreload" href="/${f}">`),
      ]
      if (hints.length > 0)
        out = out.replace('</head>', `    ${hints.join('\n    ')}\n  </head>`)

      return out
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [
    vue(),
    tailwindcss(),
    assetLoadingOptimizations(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'icon.svg',
        'icon-light.svg',
        'icon-dark.svg',
        'apple-touch-icon.png',
        'apple-touch-icon-dark.png',
        'pwa-192x192.png',
        'pwa-192x192-dark.png',
        'pwa-512x512.png',
        'pwa-512x512-dark.png',
        'og-image.png',
        'og-image-light.png',
        'og-image-dark.png',
        'robots.txt',
      ],
      manifest: {
        name: 'Maina Voice',
        short_name: 'MainaVoice',
        description: 'Speech-to-text dictation and multi-engine speed benchmarking with local IndexedDB storage.',
        theme_color: '#141414',
        background_color: '#141414',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        categories: ['utilities', 'productivity', 'speech-to-text'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  envPrefix: ['VITE_'],
  server: {
    port: 5173,
  },
}))

