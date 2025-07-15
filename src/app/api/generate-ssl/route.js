// app/api/generate-ssl.js
import { spawn } from 'child_process';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { domain, email } = await req.json();

  const cmd = `${process.env.HOME}/.acme.sh/acme.sh`;
  const args = [
    '--issue',
    '--dns',
    '--yes-I-know-dns-manual',
    '--domain', domain,
    '--accountemail', email,
    '--createDNSRecord'
  ];

  return new Promise(resolve => {
    const acme = spawn(cmd, args);
    let output = '';

    acme.stdout.on('data', data => (output += data));
    acme.stderr.on('data', data => (output += data));

    acme.on('close', () => {
      const match = output.match(/_acme-challenge\..+\s+TXT\s+"([^"]+)"/);
      if (!match) return resolve(NextResponse.json({ success: false, error: 'Could not parse TXT' }));

      resolve(NextResponse.json({
        success: true,
        txtRecord: `_acme-challenge.${domain} TXT "${match[1]}"`
      }));
    });
  });
}
