import { spawn } from "child_process";
import fs from "fs";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { domain, email } = await req.json();
  const challengeFile = `/tmp/certbot-dns-challenge-${domain}`;

  // Remove old file if exists
  try { fs.unlinkSync(challengeFile) } catch (e) {}

  // Start certbot to generate TXT record
  const certbot = spawn("certbot", [
    "certonly",
    "--manual",
    "--manual-auth-hook", "/opt/certbot-hooks/save-txt-hook.sh",
    "--manual-cleanup-hook", "/opt/certbot-hooks/delete-txt-hook.sh",
    "--preferred-challenges", "dns",
    "--non-interactive",
    "--manual-public-ip-logging-ok",
    "--agree-tos",
    "--email", email,
    "-d", domain
  ]);

  // Give it time to write the file
  await new Promise(res => setTimeout(res, 10000));
  certbot.kill();

  try {
    const txt = fs.readFileSync(challengeFile, "utf8").trim();
    return NextResponse.json({
      success: true,
      txtRecord: `_acme-challenge.${domain} 300 IN TXT "${txt}"`
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: "TXT record not found. " + err.message
    });
  }
}
