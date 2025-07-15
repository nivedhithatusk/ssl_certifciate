// app/api/verify-and-generate.js
import { spawn } from 'child_process';
import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(req) {
  const { domain } = await req.json();
  const cmd = `${process.env.HOME}/.acme.sh/acme.sh`;
  const args = ['--renew', '--dns', '--domain', domain];

  return new Promise(resolve => {
    const acme = spawn(cmd, args);
    let output = '';

    acme.stdout.on('data', d => (output += d));
    acme.stderr.on('data', d => (output += d));

    acme.on('close', () => {
      const dir = `${process.env.HOME}/.acme.sh/${domain}`;
      const certPath = path.join(dir, `${domain}.cer`);
      const keyPath = path.join(dir, `${domain}.key`);
      const fullPath = path.join(dir, `fullchain.cer`);

      if (output.includes('Your cert is in') && existsSync(certPath) && existsSync(keyPath)) {
        resolve(NextResponse.json({ 
          success: true,
          certPath, keyPath, fullPath
        }));
      } else {
        resolve(NextResponse.json({
          success: false,
          error: 'Certificate issuance failed. Check DNS propagation and try again.'
        }));
      }
    });
  });
}
