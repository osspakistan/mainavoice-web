import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function read(rel) {
  return readFileSync(join(root, rel), 'utf-8')
}

function stripTags(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function extractJsonLd(html, typeName) {
  const pattern = new RegExp(`<script\\s+type="application/ld\\+json">([\\s\\S]*?)</script>`, 'gi')
  for (const match of html.matchAll(pattern)) {
    try {
      const data = JSON.parse(match[1].trim())
      if (data['@type'] === typeName)
        return data
    }
    catch {
      // ignore malformed blocks
    }
  }
  return null
}

describe('homepage content without JavaScript', () => {
  const html = read('index.html')
  const body = html.slice(html.indexOf('<body'))
  const text = stripTags(body)

  it('has at least one h1 in the raw HTML', () => {
    const h1Tags = body.match(/<h1\b[^>]*>/gi) || []
    assert.ok(h1Tags.length >= 1, `expected at least one <h1>, found ${h1Tags.length}`)
  })

  it('has 500+ visible characters of text in raw HTML', () => {
    assert.ok(text.length >= 500, `expected >=500 chars, found ${text.length}`)
  })

  it('has a non-flat heading structure (h1, h2 and h3)', () => {
    const h2 = body.match(/<h2\b[^>]*>/gi) || []
    const h3 = body.match(/<h3\b[^>]*>/gi) || []
    assert.ok(h2.length >= 1, `expected at least one <h2>, found ${h2.length}`)
    assert.ok(h3.length >= 1, `expected at least one <h3>, found ${h3.length}`)
  })

  it('includes brand name in the fallback content', () => {
    assert.ok(/Maina Voice/.test(text), 'expected "Maina Voice" to appear in body text')
  })

  it('includes static navigation links to trust anchors', () => {
    assert.ok(/href="\/about"/.test(body), 'expected /about link')
    assert.ok(/href="\/privacy"/.test(body), 'expected /privacy link')
    assert.ok(/href="\/contact"/.test(body), 'expected /contact link')
  })
})

describe('trust anchor pages', () => {
  const middleware = read('functions/_middleware.js')

  it('has server-rendered HTML for /about, /privacy and /contact', () => {
    assert.ok(/['"]\/about['"]\s*:/.test(middleware), '/about missing in middleware')
    assert.ok(/['"]\/privacy['"]\s*:/.test(middleware), '/privacy missing in middleware')
    assert.ok(/['"]\/contact['"]\s*:/.test(middleware), '/contact missing in middleware')
  })

  it('each injected trust page has an h1 and at least 500 characters of text', () => {
    // Middleware stores page HTML in separate template-string constants such as ABOUT_HTML.
    const htmlBlocks = [...middleware.matchAll(/`([\s\S]*?)`/g)]
      .map(([, raw]) => raw)
      .filter(raw => /<h1\b/.test(raw))
    assert.ok(htmlBlocks.length >= 3, `expected >=3 page html blocks, found ${htmlBlocks.length}`)

    for (const raw of htmlBlocks) {
      const text = stripTags(raw)
      assert.ok(text.length >= 500, `expected page text >= 500 chars, found ${text.length}`)
    }
  })

  it('has vue route definitions for trust anchors', () => {
    const router = read('src/router/index.ts')
    assert.ok(/['"]\/?about['"]/.test(router), '/about route missing')
    assert.ok(/['"]\/?privacy['"]/.test(router), '/privacy route missing')
    assert.ok(/['"]\/?contact['"]/.test(router), '/contact route missing')
  })

  it('includes trust anchors in the public sitemap', () => {
    const sitemap = read('public/sitemap.xml')
    assert.ok(sitemap.includes('/about'), '/about missing from sitemap.xml')
    assert.ok(sitemap.includes('/privacy'), '/privacy missing from sitemap.xml')
    assert.ok(sitemap.includes('/contact'), '/contact missing from sitemap.xml')
  })
})

describe('brand and navigation', () => {
  it('footer links to /contact', () => {
    const footer = read('src/components/app-footer.vue')
    assert.ok(/to="\/contact"/.test(footer), 'expected footer link to /contact')
  })

  it('llms.txt references trust anchor pages', () => {
    const llms = read('public/llms.txt')
    assert.ok(llms.includes('/about'), '/about missing from llms.txt')
    assert.ok(llms.includes('/privacy'), '/privacy missing from llms.txt')
    assert.ok(llms.includes('/contact'), '/contact missing from llms.txt')
  })
})

describe('organization schema completeness', () => {
  const html = read('index.html')
  const org = extractJsonLd(html, 'Organization')

  it('has a valid Organization JSON-LD block', () => {
    assert.ok(org, 'Organization schema not found')
  })

  it('includes name, url, logo and sameAs', () => {
    assert.equal(org.name, 'Maina Voice')
    assert.equal(org.url, 'https://mainavoice.lat/')
    assert.ok(org.logo, 'expected logo')
    assert.ok(Array.isArray(org.sameAs) && org.sameAs.length > 0, 'expected sameAs array')
  })

  it('includes a contactPoint with email, contactType and url', () => {
    assert.ok(org.contactPoint, 'expected contactPoint')
    assert.equal(org.contactPoint['@type'], 'ContactPoint')
    assert.ok(org.contactPoint.email, 'expected contactPoint.email')
    assert.ok(org.contactPoint.contactType, 'expected contactPoint.contactType')
    assert.ok(org.contactPoint.url, 'expected contactPoint.url')
  })

  it('includes a PostalAddress with addressCountry', () => {
    assert.ok(org.address, 'expected address')
    assert.equal(org.address['@type'], 'PostalAddress')
    assert.ok(org.address.addressCountry, 'expected address.addressCountry')
  })
})

describe('machine-readable agent files', () => {
  it('robots.txt allows all crawlers and points to sitemap', () => {
    const robots = read('public/robots.txt')
    assert.ok(robots.includes('User-agent: *'), 'expected User-agent wildcard')
    assert.ok(robots.includes('Allow: /'), 'expected Allow: /')
    assert.ok(robots.includes('Sitemap: https://mainavoice.lat/sitemap.xml'), 'expected sitemap URL')
  })

  it('ai-catalog.json has a canonical host and entries', () => {
    const catalog = JSON.parse(read('public/.well-known/ai-catalog.json'))
    assert.equal(catalog.host.canonical, 'https://mainavoice.lat')
    assert.equal(catalog.host.displayName, 'Maina Voice')
    assert.ok(Array.isArray(catalog.entries) && catalog.entries.length > 0, 'expected entries array')
    const entry = catalog.entries[0]
    assert.ok(entry.url, 'expected entry url')
    assert.ok(entry.description, 'expected entry description')
  })
})
