import { spawn } from "child_process";
import { readFile, unlink } from "fs/promises";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { domain, email } = await req.json();
  const challengeFile = `/tmp/certbot-dns-challenge-${domain}`;

  // Clean previous file
  await unlink(challengeFile).catch(() => {});

  const certbot = spawn("certbot", [
    "certonly",
    "--manual",
    "--preferred-challenges",
    "dns",
    "--manual-auth-hook",
    "/absolute/path/to/scripts/save-txt-hook.sh",
    "--manual-cleanup-hook",
    "/absolute/path/to/scripts/delete-txt-hook.sh",
    "--non-interactive",
    "--agree-tos",
    "--email",
    email,
    "-d",
    domain
  ]);

  // Give Certbot time to run hook
  await new Promise(r => setTimeout(r, 10000));
  certbot.kill();

  try {
    const token = (await readFile(challengeFile, "utf8")).trim();
    return NextResponse.json({
      success: true,
      txtRecord: `_acme-challenge.${domain} 300 IN TXT "${token}"`
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: "TXT record not found—make sure save-txt-hook fired."
    });
  }
}
