// pages/api/ssl/generate-certificate.js

import fs from 'fs/promises';
import { exec } from 'child_process';

export async function POST(req, res) {
  const body = await req.json();

  const { challengeId } = body;

  try {
    const data = JSON.parse(await fs.readFile(`/tmp/challenge-${challengeId}.json`, 'utf8'));

    if (!data.verified) {
      return res.status(400).json({ error: 'DNS not verified' });
    }

    await runFinalCertbot(data.originalDomain, data.email);

    const basePath = `/etc/letsencrypt/live/${data.originalDomain}`;
    res.status(200).json({
      success: true,
      certPath: `${basePath}/cert.pem`,
      keyPath: `${basePath}/privkey.pem`,
      fullchainPath: `${basePath}/fullchain.pem`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function runFinalCertbot(domain, email) {
  return new Promise((resolve, reject) => {
    exec(
      `certbot certonly --manual --preferred-challenges=dns --manual-auth-hook "./hooks/auth_hook.sh" --manual-public-ip-logging-ok --agree-tos --email ${email} -d ${domain}`,
      (error, stdout, stderr) => {
        if (error) reject(stderr || error.message);
        else resolve(stdout);
      }
    );
  });
}
