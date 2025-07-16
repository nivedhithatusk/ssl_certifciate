import { exec } from 'child_process';
import fs from 'fs/promises';

export async function POST(req) {
  const body = await req.json();
  const { domain, email } = body;

  try {
    await runCertbotChallenge(domain, email);

    const txtValue = (await fs.readFile('/tmp/validation', 'utf8')).trim();
    const dnsDomain = (await fs.readFile('/tmp/domain', 'utf8')).trim();
    const challengeId = Date.now().toString();

    const data = {
      dnsDomain,
      txtValue,
      originalDomain: domain,
      email,
      verified: false,
    };
    await fs.writeFile(`/tmp/challenge-${challengeId}.json`, JSON.stringify(data));

    return new Response(
      JSON.stringify({
        challengeId,
        dnsName: `_acme-challenge.${domain}`,
        dnsValue: txtValue,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function runCertbotChallenge(domain, email) {
  return new Promise((resolve, reject) => {
    exec(
      `certbot certonly --manual --preferred-challenges=dns --manual-auth-hook "./hooks/auth_hook.sh" --manual-public-ip-logging-ok --dry-run --agree-tos --email ${email} -d ${domain}`,
      (error, stdout, stderr) => {
        if (error) reject(stderr || error.message);
        else resolve(stdout);
      }
    );
  });
}
