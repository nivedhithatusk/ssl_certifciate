import { exec } from "child_process";
import dns from "dns";
import fs from "fs";
import { NextResponse } from "next/server";

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
    const { domain } = body;
    if (!domain) return NextResponse.json({ message: "Domain required" }, { status: 400 });

    const cmd = `certbot certonly --manual --preferred-challenges dns \
      --manual-auth-hook /home/ubuntu/auth-hook.sh \
      --manual-cleanup-hook /home/ubuntu/cleanup-hook.sh \
      --manual-public-ip-logging-ok \
      --agree-tos --no-eff-email --register-unsafely-without-email \
      --staging \
      -d ${domain}`;

    await execPromise(cmd);

    // Read the token after Certbot runs auth-hook
    const content = fs.readFileSync("/tmp/certbot_dns_data.txt", "utf8");
    const match = content.match(/CERTBOT_VALIDATION=(.*)/);
    const token = match ? match[1].trim() : null;

    if (!token) return NextResponse.json({ message: "Token not found in hook output" }, { status: 500 });

    // Check DNS record
    const records = await resolveTxtPromise(`_acme-challenge.${domain}`);
    if (!records.includes(token)) {
      return NextResponse.json({ message: "DNS record does not match yet" }, { status: 400 });
    }

    return NextResponse.json({
      message: "✅ Certificate issued successfully!",
      certPath: `/etc/letsencrypt/live/${domain}/fullchain.pem`,
      keyPath: `/etc/letsencrypt/live/${domain}/privkey.pem`,
    });
  } catch (error) {
    return NextResponse.json({ message: "Verification failed", error: error.toString() }, { status: 500 });
  }
}
