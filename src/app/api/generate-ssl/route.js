import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { NextResponse } from 'next/server';

const runningCertbots = new Map();

export async function POST(req) {
  const { domain, email } = await req.json();

  console.log(`🚀 Starting Certbot for domain: ${domain}, email: ${email}`);

  const certbot = spawn('certbot', [
    'certonly',
    '--manual',
    '--preferred-challenges', 'dns',
    '--manual-auth-hook', '/opt/certbot-hooks/save-txt-hook.sh', // update with your actual path
    '--manual-cleanup-hook', '/opt/certbot-hooks/delete-txt-hook.sh', // update with your actual path
    '--non-interactive',
    '--agree-tos',
    '--manual-public-ip-logging-ok',
    '--email', email,
    '-d', domain
  ]);

  runningCertbots.set(domain, certbot);

  // 🔧 Log stdout from Certbot
  certbot.stdout.on('data', (data) => {
    console.log(`[Certbot stdout] ${data.toString()}`);
  });

  // ❗ Log stderr from Certbot
  certbot.stderr.on('data', (data) => {
    console.error(`[Certbot stderr] ${data.toString()}`);
  });

  // ⏱ Wait for the challenge file to be written (with retry)
  let txtValue = null;
  const challengePath = `/tmp/certbot-dns-challenge-${domain}`;
  console.log(`⏳ Waiting for TXT challenge file: ${challengePath}`);

  for (let i = 0; i < 10; i++) {
    if (existsSync(challengePath)) {
      try {
        txtValue = readFileSync(challengePath, 'utf8').trim();
        console.log(`✅ TXT record found: ${txtValue}`);
        break;
      } catch (readErr) {
        console.error(`❌ Failed to read challenge file: ${readErr.message}`);
      }
    }
    await new Promise((r) => setTimeout(r, 2000)); // Wait 2 seconds
  }

  if (!txtValue) {
    console.error('❌ TXT challenge file not found after timeout.');
    return NextResponse.json({ success: false, error: 'Failed to generate TXT record. File not created.' });
  }

  return NextResponse.json({
    success: true,
    txtRecord: `_acme-challenge.${domain} 300 IN TXT "${txtValue}"`
  });
}
