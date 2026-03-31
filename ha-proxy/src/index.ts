import { jwtVerify } from 'jose';

const JWT_SECRET_NAME = 'homebase_session';
const JWT_ISSUER = 'homebase';

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
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    // Block unknown origins (but allow server-to-server with no origin)
    if (origin && !allowed.includes(origin)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Verify JWT from cookie
    const cookieHeader = request.headers.get('Cookie') || '';
    const match = cookieHeader.match(new RegExp(JWT_SECRET_NAME + '=([^;]+)'));
    const token = match ? match[1] : null;

    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      const secret = new TextEncoder().encode(env.JWT_SECRET);
      await jwtVerify(token, secret, { issuer: JWT_ISSUER });
    } catch {
      return new Response('Unauthorized', { status: 401 });
    }

    // Proxy to HA
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
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  },
};

interface Env {
  HA_TOKEN: string;
  HA_URL: string;
  JWT_SECRET: string;
}
