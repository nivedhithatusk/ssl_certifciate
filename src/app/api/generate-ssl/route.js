import { spawn } from 'child_process';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { domain, email } = await req.json();
  const cmd = `${process.env.HOME}/.acme.sh/acme.sh`;
  const args = [
    '--issue',
    '--dns',
    '-d', domain,
    '--yes-I-know-dns-manual-mode-enough-go-ahead-please',
    '--accountemail', email
  ];

  const acme = spawn(cmd, args);
  let output = '';

  acme.stdout.on('data', (d) => (output += d.toString()));
  acme.stderr.on('data', (d) => (output += d.toString()));

  return new Promise((resolve) => {
    acme.on('close', () => {
      const records = [];
      const lines = output.split('\n');

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('Domain:')) {
          const domainEntry = lines[i].split('Domain:')[1].trim();
          const txtLine = lines[i + 1]; // next line is Txt value
          if (txtLine && txtLine.startsWith('Txt value:')) {
            const token = txtLine.split('Txt value:')[1].trim();
            records.push({ domain: domainEntry, token });
          }
        }
      }

      if (!records.length) {
        return resolve(NextResponse.json({ success: false, error: 'Could not parse TXT record.' }));
      }

      // If only one record, return a single string; else array
      const txtRecords = records.map(r =>
        `_acme-challenge.${r.domain} TXT "${r.token}"`
      );

      resolve(NextResponse.json({ success: true, txtRecords }));
    });
  });
}
