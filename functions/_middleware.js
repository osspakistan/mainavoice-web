export async function onRequest(context) {
  const request = context.request
  const accept = request.headers.get('accept') || ''
  const url = new URL(request.url)

  // Pass static assets straight through. Re-wrapping binary/compressed responses
  // with a new Response object can corrupt them and drops the original status code.
  if (/\.[^/]{1,10}$/.test(url.pathname)) {
    return context.next()
  }

  const response = await context.next()
  const contentType = response.headers.get('Content-Type') || ''

  // Only add Vary / negotiate for HTML pages (404.html included).
  if (!contentType.includes('text/html')) {
    return response
  }

  const html = await response.text()

  if (accept.includes('text/markdown')) {
    const plain = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()

    const title = url.pathname === '/' ? url.host : `${url.host}${url.pathname}`
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
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
