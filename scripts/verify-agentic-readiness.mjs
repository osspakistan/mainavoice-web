import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

function read(rel) {
  return readFileSync(join(root, rel), 'utf-8')
}

function strip(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function extractJsonLd(html, typeName) {
  for (const match of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1].trim())
      if (data['@type'] === typeName)
        return data
    }
    catch {
      // ignore
    }
  }
  return null
}

function check(label, fn) {
  try {
    fn()
    console.log(`✔ ${label}`)
  }
  catch (err) {
    console.error(`✖ ${label}`)
    console.error(err.message)
    process.exitCode = 1
  }
}

console.log('Verifying agentic-readiness build artifacts…\n')

check('dist/index.html exists', () => assert.ok(existsSync(join(root, 'dist/index.html'))))

const html = read('dist/index.html')
const body = html.slice(html.indexOf('<body'))
const bodyText = strip(body)

check('built homepage contains an <h1>', () => assert.ok((body.match(/<h1\b[^>]*>/gi) || []).length >= 1))
check('built homepage has 500+ chars of body text', () => assert.ok(bodyText.length >= 500))
check('built homepage has h2 and h3 headings', () => {
  assert.ok((body.match(/<h2\b[^>]*>/gi) || []).length >= 1)
  assert.ok((body.match(/<h3\b[^>]*>/gi) || []).length >= 1)
})

check('built homepage links to trust anchors', () => {
  assert.ok(/href="\/about"/.test(body))
  assert.ok(/href="\/privacy"/.test(body))
  assert.ok(/href="\/contact"/.test(body))
})

check('Organization schema is complete', () => {
  const org = extractJsonLd(html, 'Organization')
  assert.ok(org, 'Organization schema not found')
  assert.equal(org.name, 'Maina Voice')
  assert.ok(org.logo, 'logo missing')
  assert.ok(org.contactPoint, 'contactPoint missing')
  assert.ok(org.contactPoint.email, 'contactPoint.email missing')
  assert.ok(org.contactPoint.contactType, 'contactPoint.contactType missing')
  assert.equal(org.address['@type'], 'PostalAddress')
  assert.ok(org.address.addressCountry, 'address.country missing')
})

check('robots.txt allows crawlers and links to sitemap', () => {
  const robots = read('dist/robots.txt')
  assert.ok(robots.includes('User-agent: *'))
  assert.ok(robots.includes('Allow: /'))
  assert.ok(robots.includes('https://mainavoice.lat/sitemap.xml'))
})

check('sitemap.xml lists trust anchors', () => {
  const sitemap = read('dist/sitemap.xml')
  assert.ok(sitemap.includes('/about'))
  assert.ok(sitemap.includes('/privacy'))
  assert.ok(sitemap.includes('/contact'))
})

check('ai-catalog.json is valid', () => {
  const catalog = JSON.parse(read('dist/.well-known/ai-catalog.json'))
  assert.equal(catalog.host.canonical, 'https://mainavoice.lat')
  assert.ok(Array.isArray(catalog.entries) && catalog.entries.length > 0)
})

check('llms.txt references trust anchors', () => {
  const llms = read('dist/llms.txt')
  assert.ok(llms.includes('/about'))
  assert.ok(llms.includes('/privacy'))
  assert.ok(llms.includes('/contact'))
})

check('middleware trust-anchor pages are still long enough', () => {
  const mw = read('functions/_middleware.js')
  const pageBlocks = [...mw.matchAll(/`([\s\S]*?)`/g)]
    .map(([, raw]) => raw)
    .filter(raw => /<h1\b/.test(raw))
  assert.ok(pageBlocks.length >= 3)
  pageBlocks.forEach((raw, i) => {
    const text = strip(raw)
    assert.ok(text.length >= 500, `page ${i} has only ${text.length} chars`)
  })
})

console.log('\nVerification complete.')
