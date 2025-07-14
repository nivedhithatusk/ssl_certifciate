import { spawn } from "child_process";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { domain, email } = await req.json();

  return new Promise(resolve => {
    let output = "";
    const certbot = spawn("certbot", [
      "certonly",
      "--manual",
      "--manual-auth-hook", "/bin/true",
      "--manual-cleanup-hook", "/opt/certbot-hooks/delete-txt-hook.sh",
      "--preferred-challenges", "dns",
      "--non-interactive",
      "--manual-public-ip-logging-ok",
      "--agree-tos",
      "--email", email,
      "-d", domain
    ]);

    certbot.stdout.on("data", data => output += data);
    certbot.stderr.on("data", data => output += data);

    certbot.on("close", code => {
      if (code === 0) {
        resolve(NextResponse.json({ success: true }));
      } else {
        resolve(NextResponse.json({ success: false, error: output }));
      }
    });
  });
}
