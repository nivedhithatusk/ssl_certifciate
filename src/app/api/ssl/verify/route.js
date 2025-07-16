// src/app/api/ssl/verify/route.js
import dns from 'dns';
import { exec } from 'child_process';
import { NextResponse } from 'next/server';

// Helper to run exec as a promise
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

// Helper to run DNS TXT lookup as a promise
function resolveTxtPromise(hostname) {
  return new Promise((resolve, reject) => {
    dns.resolveTxt(hostname, (err, records) => {
      if (err) reject(err);
      else resolve(records.flat());
    });
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { domain, expectedValue } = body;

    if (!domain || !expectedValue) {
      return NextResponse.json({ message: 'Domain and expectedValue required' }, { status: 400 });
    }

    const records = await resolveTxtPromise(`_acme-challenge.${domain}`);
    if (!records.includes(expectedValue)) {
      return NextResponse.json({ message: 'DNS record does not match yet' }, { status: 400 });
    }

    const cmd = `certbot certonly --manual --preferred-challenges dns \
      --manual-auth-hook /home/ubuntu/auth-hook.sh \
      --manual-cleanup-hook /home/ubuntu/cleanup-hook.sh \
      --manual-public-ip-logging-ok \
      --agree-tos --no-eff-email --register-unsafely-without-email \
      --staging \
      -d ${domain}`;

    await execPromise(cmd);

    return NextResponse.json({
      message: 'Certificate issued successfully!',
      certPath: `/etc/letsencrypt/live/${domain}/fullchain.pem`,
      keyPath: `/etc/letsencrypt/live/${domain}/privkey.pem`
    });

  } catch (error) {
    return NextResponse.json(
      { message: 'Verification failed', error: error.toString() },
      { status: 500 }
    );
  }
}
