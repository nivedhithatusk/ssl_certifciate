import { NextResponse } from "next/server";
import { spawn } from "child_process";

let certbotProcess = null;
let challengeData = null;

export async function POST(req) {
  const body = await req.json();
  const { domain, email } = body;

  if (!domain || !email) {
    return NextResponse.json({ message: "Domain and email required" }, { status: 400 });
  }

  return new Promise((resolve, reject) => {
    certbotProcess = spawn("certbot", [
      "certonly",
      "--manual",
      "--preferred-challenges", "dns",
      "--manual-public-ip-logging-ok",
      "--agree-tos",
      "--no-eff-email",
      "-m", email,
      "-d", domain,
    ]);

    let stdoutData = "";

    certbotProcess.stdout.on("data", (data) => {
      const output = data.toString();
      stdoutData += output;

      // Check for DNS challenge string
      const match = output.match(/_acme-challenge\..+\s+TXT\s+(\S+)/);
      if (match && !challengeData) {
        challengeData = match[1];

        resolve(
          NextResponse.json({
            dnsRecord: `_acme-challenge.${domain}`,
            dnsType: "TXT",
            dnsValue: challengeData,
            message: "Add this DNS record, then click Verify.",
          })
        );
      }
    });

    certbotProcess.stderr.on("data", (data) => {
      console.error("Certbot error:", data.toString());
    });

    certbotProcess.on("close", (code) => {
      console.log(`Certbot closed with code ${code}`);
      certbotProcess = null;
      challengeData = null;
    });
  });
}
