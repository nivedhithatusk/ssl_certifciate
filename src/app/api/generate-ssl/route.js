// app/api/generate-ssl/route.js
import { spawn } from 'child_process';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { domain, email } = await req.json();
  const cmd = "/root/.acme.sh/acme.sh"; // replace with correct path
  const args = [
    "--issue",
    "--dns",
    "-d", domain,
    "--yes-I-know-dns-manual-mode-enough-go-ahead-please",
    "--accountemail", email
  ];

  console.log(`[SSL] Running: ${cmd} ${args.join(" ")}`);

  const acme = spawn(cmd, args);
  let output = "", errorOutput = "";

  acme.stdout.on("data", d => {
    output += d.toString();
    console.log("[SSL stdout]", d.toString());
  });
  acme.stderr.on("data", d => {
    errorOutput += d.toString();
    console.error("[SSL stderr]", d.toString());
  });

  return new Promise(resolve => {
    acme.on("close", code => {
      console.log(`[SSL] process exited with code ${code}`);
      if (code !== 0) {
        return resolve(NextResponse.json({ success: false, error: `Acme.sh exited code ${code}. stderr: ${errorOutput}` }));
      }

      const match = output.match(/Txt value:(.+)/i);
      if (!match) {
        console.error("[SSL] No TXT match in output:", output);
        return resolve(NextResponse.json({ success: false, error: "No TXT challenge found in acme.sh output" }));
      }

      const token = match[1].trim();
      const txtRecord = `_acme-challenge.${domain} TXT "${token}"`;
      console.log("[SSL] TXT record:", txtRecord);
      resolve(NextResponse.json({ success: true, txtRecord }));
    });

    // Safety timeout
    setTimeout(() => {
      console.error("[SSL] Timeout after 2 minutes");
      acme.kill();
      resolve(NextResponse.json({ success: false, error: "Timed out waiting for acme.sh" }));
    }, 120000);
  });
}
