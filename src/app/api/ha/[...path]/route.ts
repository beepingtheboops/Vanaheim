export const runtime = 'edge';

const HA_WORKER = 'https://super-rain-384e.mattwillson.workers.dev';

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const url = new URL(request.url);
  const haUrl = `${HA_WORKER}/api/ha/${path}${url.search}`;

  const response = await fetch(haUrl, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('Cookie') || '',
      'Origin': 'https://thewillsons.com',
    },
  });

  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const haUrl = `${HA_WORKER}/api/ha/${path}`;
  const body = await request.text();

  const response = await fetch(haUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('Cookie') || '',
      'Origin': 'https://thewillsons.com',
    },
    body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
