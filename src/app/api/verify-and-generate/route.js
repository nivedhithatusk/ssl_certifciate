import { spawn } from "child_process";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { domain, email } = await req.json();

  return new Promise(resolve => {
    const certbot = spawn("certbot", [
      "certonly",
      "--manual",
      "--preferred-challenges",
      "dns",
      "--manual-auth-hook",
      "/bin/true",
      "--manual-cleanup-hook",
      "/absolute/path/to/scripts/delete-txt-hook.sh",
      "--non-interactive",
      "--agree-tos",
      "--email",
      email,
      "-d",
      domain
    ]);

    let log = "";
    certbot.stdout.on("data", data => (log += data));
    certbot.stderr.on("data", data => (log += data));

    certbot.on("close", code => {
      if (code === 0) {
        resolve(NextResponse.json({ success: true }));
      } else {
        resolve(NextResponse.json({ success: false, error: log }));
      }
    });
  });
}
