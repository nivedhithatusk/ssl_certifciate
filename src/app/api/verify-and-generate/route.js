import { spawn } from 'child_process';
import path from 'path';

export async function POST(req) {
  const { domain, email } = await req.json();

  const acmeCmd = spawn(
    path.join(process.env.HOME, '.acme.sh/acme.sh'),
    [
      '--renew',
      '-d', domain,
      '--yes',
      '--debug',
      '--log'
    ]
  );

  let stderr = '';

  acmeCmd.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  return new Promise((resolve) => {
    acmeCmd.on('close', (code) => {
      if (code === 0) {
        resolve(new Response(JSON.stringify({
          success: true,
          message: 'SSL certificate issued successfully.'
        }), { status: 200 }));
      } else {
        resolve(new Response(JSON.stringify({
          success: false,
          error: `Acme.sh exited code ${code}. stderr: ${stderr}`
        }), { status: 500 }));
      }
    });
  });
}
