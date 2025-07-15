import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import path from 'path';

export async function POST(req) {
  const { domain, email } = await req.json();
  const challengeFile = `/tmp/certbot-dns-challenge-${domain}`;

  const acmeCmd = spawn(
    path.join(process.env.HOME, '.acme.sh/acme.sh'),
    [
      '--issue',
      '--dns', 'manual',
      '-d', domain,
      '--accountemail', email,
      '--yes',
      '--debug',
      '--log',
      '--pre-hook', path.resolve('scripts/save-txt-hook.sh'),
      '--post-hook', path.resolve('scripts/delete-txt-hook.sh'),
      '--test'
    ],
    {
      env: {
        ...process.env,
        CERTBOT_DOMAIN: domain,
        CERTBOT_VALIDATION: 'fake-validation', // placeholder
      }
    }
  );

  return new Promise((resolve) => {
    acmeCmd.on('close', async () => {
      try {
        const txt = await readFile(challengeFile, 'utf8');
        resolve(
          new Response(JSON.stringify({
            success: true,
            txtRecord: `_acme-challenge.${domain} 300 IN TXT "${txt.trim()}"`
          }), { status: 200 })
        );
      } catch (err) {
        resolve(
          new Response(JSON.stringify({
            success: false,
            error: 'TXT record not found—make sure save-txt-hook fired.'
          }), { status: 500 })
        );
      }
    });
  });
}
