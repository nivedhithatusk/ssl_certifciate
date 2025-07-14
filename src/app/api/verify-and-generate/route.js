import { NextResponse } from 'next/server';

export async function POST(req) {
  const { domain } = await req.json();

  const certbot = global.runningCertbots?.get(domain);
  if (!certbot) {
    return NextResponse.json({ success: false, error: 'No running process found.' });
  }

  // Wait for Certbot to finish
  const result = await new Promise((resolve) => {
    certbot.on('exit', (code) => {
      resolve(code === 0 ? { success: true } : { success: false, error: 'Certbot failed' });
    });
  });

  // Clean up
  global.runningCertbots?.delete(domain);
  return NextResponse.json(result);
}
