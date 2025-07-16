// src/app/api/ssl/prepare/route.js
import { exec } from 'child_process';
import fs from 'fs';
import { NextResponse } from 'next/server';

// Utility to wrap exec in a promise
function execPromise(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { domain, email } = body;

    if (!domain || !email) {
      return NextResponse.json({ message: 'Domain and email required' }, { status: 400 });
    }

    // Remove old data if any
    if (fs.existsSync('/tmp/certbot_dns_data.txt')) {
      fs.unlinkSync('/tmp/certbot_dns_data.txt');
    }

    const cmd = `certbot certonly --manual --preferred-challenges dns \
      --manual-auth-hook /home/ubuntu/auth-hook.sh \
      --manual-cleanup-hook /home/ubuntu/cleanup-hook.sh \
      --manual-public-ip-logging-ok \
      --agree-tos --no-eff-email --register-unsafely-without-email \
      --staging \
      -d ${domain}`;

    await execPromise(cmd);

    const content = fs.readFileSync('/tmp/certbot_dns_data.txt', 'utf8');
    const match = content.match(/CERTBOT_VALIDATION=(.*)/);
    const token = match ? match[1].trim() : null;

    if (!token) {
      return NextResponse.json({ message: 'Token not found in hook output' }, { status: 500 });
    }

    return NextResponse.json({
      dnsRecord: `_acme-challenge.${domain}`,
      dnsType: 'TXT',
      dnsValue: token
    });
  } catch (err) {
    return NextResponse.json({ message: 'Certbot prepare failed', error: err.toString() }, { status: 500 });
  }
}
