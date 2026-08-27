import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { onRequest } from '../functions/_middleware.js'

const root = fileURLToPath(new URL('../dist', import.meta.url))
const port = Number(process.env.PORT || 8788)

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
}

function contentType(path) {
  const ext = extname(path)
  return types[ext] || 'application/octet-stream'
}

function assetFetch(request) {
  const url = new URL(request.url)
  const path = url.pathname
  const file = join(root, path)
  const safe = file.startsWith(root) ? file : join(root, 'index.html')
  const data = existsSync(safe) && readFileSync(safe)
  if (!data) {
    const notFound = join(root, '404.html')
    return new Response(existsSync(notFound) ? readFileSync(notFound) : 'Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
  return new Response(data, {
    status: 200,
    headers: { 'Content-Type': contentType(safe) },
  })
}

const server = createServer(async (req, res) => {
  const streamToRes = (r) => {
    res.writeHead(r.status, Object.fromEntries(r.headers.entries()))
    if (r.body && r.body.getReader) {
      const reader = r.body.getReader()
      function pump() {
        reader.read().then(({ done, value }) => {
          if (done) {
            res.end()
          }
          else {
            res.write(Buffer.from(value))
            pump()
          }
        })
      }
      pump()
    }
    else {
      r.text().then(text => res.end(text)).catch(() => res.end())
    }
  }

  try {
    const context = {
      request: new Request(`http://localhost:${port}${req.url}`, {
        method: req.method,
        headers: new Headers(Object.entries(req.headers)),
      }),
      env: { ASSETS: { fetch: assetFetch } },
      next: () => assetFetch(new Request(`http://localhost:${port}${req.url}`)),
    }
    const response = await onRequest(context)
    streamToRes(response)
  }
  catch (err) {
    console.error(err)
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Internal server error')
  }
})

server.listen(port, () => {
  console.log(`Local Pages server listening on http://localhost:${port}`)
})
