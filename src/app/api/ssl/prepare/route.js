import fs from "fs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { domain } = body;
    if (!domain) return NextResponse.json({ message: "Domain required" }, { status: 400 });

    // Remove any previous data
    if (fs.existsSync("/tmp/certbot_dns_data.txt")) {
      fs.unlinkSync("/tmp/certbot_dns_data.txt");
    }

    return NextResponse.json({
      dnsRecord: `_acme-challenge.${domain}`,
      dnsType: "TXT",
      dnsValue: "Will be generated after user clicks 'Verify'"
    });
  } catch (err) {
    return NextResponse.json({ message: "Prepare failed", error: err.toString() }, { status: 500 });
  }
}
