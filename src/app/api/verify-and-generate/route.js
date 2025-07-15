import { spawn } from 'child_process';
import { NextResponse } from 'next/server';
import path from 'path';

export async function POST(req) {
  const { domain } = await req.json();

  return new Promise((resolve) => {
    const certbot = spawn('certbot', [
      'certonly',
      '--manual',
      '--preferred-challenges', 'dns',
      '--manual-auth-hook', '/bin/true',
      '--manual-cleanup-hook', path.resolve('./scripts/delete-txt-hook.sh'),
      '--non-interactive',
      '--manual-public-ip-logging-ok',
      '--agree-tos',
      '-d', domain
    ]);

    certbot.on('exit', (code) => {
      if (code === 0) {
        resolve(NextResponse.json({ success: true }));
      } else {
        resolve(NextResponse.json({
          success: false,
          error: `Certbot failed. Exit code: ${code}`
        }));
      }
    });
  });
}
