import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

export async function POST(req) {
  const { domain, email } = await req.json();
  const challengeFile = path.join('/tmp', `certbot-dns-challenge-${domain}`);

  const certbot = spawn('certbot', [
    'certonly',
    '--manual',
    '--preferred-challenges', 'dns',
    '--manual-auth-hook', path.resolve('./scripts/save-txt-hook.sh'),
    '--manual-cleanup-hook', path.resolve('./scripts/delete-txt-hook.sh'),
    '--non-interactive',
    '--manual-public-ip-logging-ok',
    '--agree-tos',
    '--email', email,
    '-d', domain
  ]);

  await new Promise((resolve) => setTimeout(resolve, 8000));

  try {
    const txtValue = await readFile(challengeFile, 'utf8');
    return NextResponse.json({
      success: true,
      txtRecord: `_acme-challenge.${domain} 300 IN TXT "${txtValue.trim()}"`
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: `TXT record not found. ${err.message}`
    });
  }
}
