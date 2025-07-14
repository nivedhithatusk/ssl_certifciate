import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { NextResponse } from 'next/server';

const runningCertbots = new Map();

export async function POST(req) {
  const { domain, email } = await req.json();

  const certbot = spawn('certbot', [
    'certonly',
    '--manual',
    '--preferred-challenges', 'dns',
    '--manual-auth-hook', '/absolute/path/to/save-txt-hook.sh',
    '--manual-cleanup-hook', '/absolute/path/to/delete-txt-hook.sh',
    '--non-interactive',
    '--agree-tos',
    '--manual-public-ip-logging-ok',
    '--email', email,
    '-d', domain
  ]);

  // Track the process so we can resume later
  runningCertbots.set(domain, certbot);

  // Wait a few seconds to read challenge from file
  await new Promise(resolve => setTimeout(resolve, 5000));

  let txtValue;
  try {
    txtValue = require('fs').readFileSync(`/tmp/certbot-dns-challenge-${domain}`, 'utf8').trim();
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Failed to generate TXT record.' });
  }

  return NextResponse.json({
    success: true,
    txtRecord: `_acme-challenge.${domain} 300 IN TXT "${txtValue}"`
  });
}
