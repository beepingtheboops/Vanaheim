export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '';
    const allowed = ['https://thewillsons.com', 'https://vanaheim.pages.dev'];

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : '',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (!allowed.includes(origin)) {
      return new Response('Forbidden', { status: 403 });
    }

    const url = new URL(request.url);
    const haPath = url.pathname.replace('/api/ha', '/api');
    const haUrl = `${env.HA_URL}${haPath}${url.search}`;

    const haResponse = await fetch(haUrl, {
      method: request.method,
      headers: {
        'Authorization': `Bearer ${env.HA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: request.method !== 'GET' ? request.body : undefined,
    });

    return new Response(haResponse.body, {
      status: haResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  },
};

interface Env {
  HA_TOKEN: string;
  HA_URL: string;
}