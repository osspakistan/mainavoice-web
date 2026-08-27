export async function onRequest(context) {
  const request = context.request
  const accept = request.headers.get('accept') || ''
  const url = new URL(request.url)

  const isStaticFile = /\.[a-zA-Z0-9]+$/.test(url.pathname)

  if (accept.includes('text/markdown') && !isStaticFile) {
    const response = await context.next()
    const contentType = response.headers.get('Content-Type') || ''

    if (!contentType.includes('text/html')) {
      return response
    }

    const html = await response.text()
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

  const response = await context.next()
  const headers = new Headers(response.headers)
  headers.set('Vary', 'Accept, Accept-Encoding')
  return new Response(response.body, { ...response, headers })
}
