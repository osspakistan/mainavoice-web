const ABOUT_TITLE = 'About Maina Voice // Local-first Voice Transcription'
const ABOUT_DESC = 'Maina Voice is a local-first, browser-based speech-to-text workbench. Everything stays in your IndexedDB; audio goes directly from your browser to OpenRouter or Groq.'
const ABOUT_HTML = `
<div class="max-w-[714px] mx-auto space-y-6 animate-in fade-in-50 duration-300">
  <div class="rounded-2xl border border-border bg-card p-8 shadow-xs space-y-6">
    <h1 class="text-2xl font-bold text-foreground">About Maina Voice</h1>
    <p class="text-sm text-muted-foreground leading-relaxed">
      Maina Voice is a local-first, browser-based speech-to-text workbench. We built it for people who
      want to dictate, transcribe and benchmark cloud voice models without handing every recording to a
      third-party product server. All recordings, audio blobs, transcript versions and settings live in
      your browser's IndexedDB. The only network call is the one you choose to make — from your
      browser directly to OpenRouter or Groq using your own API key.
    </p>
    <div class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-xl border border-border bg-background p-4 space-y-2">
        <h2 class="text-sm font-bold text-foreground">Dictate &amp; transcribe</h2>
        <p class="text-xs text-muted-foreground leading-relaxed">
          Record from your microphone or upload an existing audio file. Audio is normalised to WAV and
          sent straight to the provider you pick.
        </p>
      </div>
      <div class="rounded-xl border border-border bg-background p-4 space-y-2">
        <h2 class="text-sm font-bold text-foreground">Benchmark engines</h2>
        <p class="text-xs text-muted-foreground leading-relaxed">
          Run the same clip through OpenAI, Deepgram, NVIDIA, Fish Audio and Groq Whisper to compare
          speed, cost and quality side by side.
        </p>
      </div>
      <div class="rounded-xl border border-border bg-background p-4 space-y-2">
        <h2 class="text-sm font-bold text-foreground">Stay private</h2>
        <p class="text-xs text-muted-foreground leading-relaxed">
          Your data never touches our servers. Export or import everything as a ZIP backup whenever you
          want.
        </p>
      </div>
    </div>
    <p class="text-sm text-muted-foreground leading-relaxed">
      Maina Voice is open source under the MIT license and is maintained by Awais Alwaisy. The source
      code, changelog and issue tracker live on GitHub.
    </p>
  </div>
</div>
`

const PRIVACY_TITLE = 'Privacy Policy // Maina Voice'
const PRIVACY_DESC = 'Maina Voice keeps your voice and transcripts under your control. There is no account, no analytics beacon and no first-party backend that stores your data.'
const PRIVACY_HTML = `
<div class="max-w-[714px] mx-auto space-y-6 animate-in fade-in-50 duration-300">
  <div class="rounded-2xl border border-border bg-card p-8 shadow-xs space-y-6">
    <h1 class="text-2xl font-bold text-foreground">Privacy Policy</h1>
    <p class="text-sm text-muted-foreground leading-relaxed">
      Maina Voice is designed so your voice and transcripts stay under your control. There is no
      account system, no analytics beacon and no first-party backend that stores your data.
    </p>
    <div class="space-y-4">
      <div class="rounded-xl border border-border bg-background p-4">
        <h2 class="text-sm font-bold text-foreground mb-2">What stays on your device</h2>
        <p class="text-xs text-muted-foreground leading-relaxed">
          Every audio recording, WAV blob, generated transcript, translation, comparison result and
          application setting is stored in the IndexedDB inside your own browser. We cannot access it,
          sell it or lose it in a server breach because we never receive it.
        </p>
      </div>
      <div class="rounded-xl border border-border bg-background p-4">
        <h2 class="text-sm font-bold text-foreground mb-2">What leaves your device</h2>
        <p class="text-xs text-muted-foreground leading-relaxed">
          The only network request happens when you choose to transcribe. Your audio file is POSTed
          directly from your browser to the speech provider you selected using your own API key. Maina
          Voice does not proxy, log or store that audio.
        </p>
      </div>
      <div class="rounded-xl border border-border bg-background p-4">
        <h2 class="text-sm font-bold text-foreground mb-2">Backups and exports</h2>
        <p class="text-xs text-muted-foreground leading-relaxed">
          You can export your full history and recordings as a ZIP archive from the Settings page at
          any time. That archive is generated locally in your browser and saved to your local disk.
        </p>
      </div>
    </div>
    <p class="text-sm text-muted-foreground leading-relaxed">
      If you want your data gone, clear your browser storage for mainavoice.lat. For questions,
      reach out through the contact page or open a GitHub issue.
    </p>
  </div>
</div>
`

const CONTACT_TITLE = 'Contact // Maina Voice'
const CONTACT_DESC = 'Have a question, bug report or feature idea? Reach the maintainers through GitHub issues or email.'
const CONTACT_HTML = `
<div class="max-w-[714px] mx-auto space-y-6 animate-in fade-in-50 duration-300">
  <div class="rounded-2xl border border-border bg-card p-8 shadow-xs space-y-6">
    <h1 class="text-2xl font-bold text-foreground">Contact</h1>
    <p class="text-sm text-muted-foreground leading-relaxed">
      Have a question, bug report or feature idea? The fastest way to reach the maintainers is
      through the public issue tracker. For private questions, send an email.
    </p>
    <div class="grid gap-4 sm:grid-cols-2">
      <a href="mailto:support@mainavoice.lat" class="group flex items-start gap-4 rounded-xl border border-border bg-background p-4 hover:border-primary/50 transition">
        <div>
          <h2 class="text-sm font-bold text-foreground">Email</h2>
          <p class="text-xs text-muted-foreground mt-1">support@mainavoice.lat</p>
        </div>
      </a>
      <a href="https://github.com/alwaisy/mainavoice-web/issues" target="_blank" rel="noopener noreferrer" class="group flex items-start gap-4 rounded-xl border border-border bg-background p-4 hover:border-primary/50 transition">
        <div>
          <h2 class="text-sm font-bold text-foreground">GitHub Issues</h2>
          <p class="text-xs text-muted-foreground mt-1">Report bugs and request features</p>
        </div>
      </a>
    </div>
    <p class="text-sm text-muted-foreground leading-relaxed">
      We typically respond to GitHub issues within a few days. If your question is about a specific
      transcription provider, make sure you include the model name, provider and a description of
      what went wrong.
    </p>
    <p class="text-sm text-muted-foreground leading-relaxed">
      Maina Voice is maintained by Awais Alwaisy as an open-source project. You can follow development,
      review the changelog and contribute on GitHub at
      <a href="https://github.com/alwaisy/mainavoice-web" target="_blank" rel="noopener noreferrer">alwaisy/mainavoice-web</a>.
    </p>
  </div>
</div>
`

const PAGES = {
  '/about': { title: ABOUT_TITLE, description: ABOUT_DESC, html: ABOUT_HTML },
  '/privacy': { title: PRIVACY_TITLE, description: PRIVACY_DESC, html: PRIVACY_HTML },
  '/contact': { title: CONTACT_TITLE, description: CONTACT_DESC, html: CONTACT_HTML },
}

function isKnownRoute(path) {
  const base = path.replace(/\/$/, '') || '/'
  const exact = ['/', '/compare', '/history', '/settings', '/about', '/privacy', '/contact']
  if (exact.includes(base))
    return true
  return base.startsWith('/history/')
}

export async function onRequest(context) {
  const request = context.request
  const accept = request.headers.get('accept') || ''
  const url = new URL(request.url)
  const path = url.pathname
  const base = path.replace(/\/$/, '') || '/'

  // Pass static assets straight through. Re-wrapping binary/compressed responses
  // with a new Response object can corrupt them and drops the original status code.
  if (/\.[^/]{1,10}$/.test(path)) {
    return context.next()
  }

  const assets = context.env.ASSETS
  let response
  let is404 = false

  if (!assets) {
    return context.next()
  }

  if (isKnownRoute(path)) {
    response = await assets.fetch(new Request(new URL('/index.html', request.url)))
  }
  else {
    response = await assets.fetch(new Request(new URL('/404.html', request.url)))
    is404 = true
  }

  const contentType = response.headers.get('Content-Type') || ''

  // Only negotiate / inject for HTML pages.
  if (!contentType.includes('text/html')) {
    return response
  }

  let html = await response.text()

  // Inject static, route-specific HTML for trust-anchor pages so non-JS crawlers see real content.
  const page = PAGES[base]
  if (page) {
    // Remove the generic no-JS fallback so the route-specific content is the only page copy,
    // while keeping the <noscript> style that hides the boot splash for users without JS.
    html = html.replace(/<noscript>\s*<main class="no-js-fallback"[^>]*>[\s\S]*?<\/main>\s*<\/noscript>/i, '')
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)
      .replace(/<meta name="description" content="[^"]*"[^>]*>/, `<meta name="description" content="${page.description}" />`)
      .replace(/<div id="app"><\/div>/, `<div id="app">${page.html}</div>`)
  }

  if (accept.includes('text/markdown')) {
    const plain = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()

    const title = base === '/' ? url.host : `${url.host}${base}`
    return new Response(`# ${title}\n\n${plain.slice(0, 6000)}`, {
      status: response.status,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Vary': 'Accept, Accept-Encoding',
      },
    })
  }

  const headers = new Headers(response.headers)
  headers.set('Vary', 'Accept, Accept-Encoding')
  return new Response(html, {
    status: is404 ? 404 : response.status,
    statusText: response.statusText,
    headers,
  })
}
