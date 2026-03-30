export async function verifyTurnstile(token: string, ip?: string, env?: any): Promise<boolean> {
  try {
    const TURNSTILE_SECRET = env?.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY || '';
    console.log('TURNSTILE_SECRET loaded:', TURNSTILE_SECRET ? 'YES' : 'NO', 'length:', TURNSTILE_SECRET.length);
    
    const body: Record<string, string> = {
      secret: TURNSTILE_SECRET,
      response: token,
    };
    if (ip) body.remoteip = ip;

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json() as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}