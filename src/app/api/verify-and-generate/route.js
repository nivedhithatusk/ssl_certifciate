import { spawn } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { domain } = await req.json();
  const cmd = `${process.env.HOME}/.acme.sh/acme.sh`;
  const args = ["--renew", "--dns", "--domain", domain];

  const acme = spawn(cmd, args);
  let output = "";

  for await (const chunk of acme.stdout) output += chunk;
  for await (const chunk of acme.stderr) output += chunk;

  return new Promise((resolve) => {
    acme.on("close", (code) => {
      const dir = path.join(process.env.HOME, ".acme.sh", domain);
      const cert = path.join(dir, `${domain}.cer`);
      const key = path.join(dir, `${domain}.key`);
      if (code === 0 && existsSync(cert) && existsSync(key)) {
        resolve(NextResponse.json({
          success: true,
          certPath: cert,
          keyPath: key,
          fullchain: path.join(dir, "fullchain.cer")
        }));
      } else {
        resolve(NextResponse.json({
          success: false,
          error: "Issuance failed. DNS may not have propagated."
        }));
      }
    });
  });
}
