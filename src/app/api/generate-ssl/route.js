import { spawn } from "child_process";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { domain, email } = await req.json();
  const cmd = `${process.env.HOME}/.acme.sh/acme.sh`;
  const args = [
    "--issue",
    "--dns",
    "-d", domain,
    "--yes-I-know-dns-manual-mode-enough-go-ahead-please",
    "--accountemail", email
  ];

  const acme = spawn(cmd, args);
  let output = "";

  for await (const chunk of acme.stdout) output += chunk;
  for await (const chunk of acme.stderr) output += chunk;

  return new Promise((resolve) => {
    acme.on("close", () => {
      const matches = [...output.matchAll(/Domain:(.+)[\\r]?\\nTxt value:(.+)/gi)];
      if (!matches.length) {
        return resolve(NextResponse.json({ success: false, error: "Failed to parse challenge." }));
      }

      const records = matches.map(([, d, t]) => ({
        domain: d.trim(),
        token: t.trim(),
        record: `_acme-challenge.${d.trim()} TXT "${t.trim()}"`
      }));

      resolve(NextResponse.json({ success: true, records }));
    });
  });
}
