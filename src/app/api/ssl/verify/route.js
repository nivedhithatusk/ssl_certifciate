import { NextResponse } from "next/server";

export async function POST(req) {
  if (!global.certbotProcess) {
    return NextResponse.json({ message: "No ongoing certbot process found." }, { status: 400 });
  }

  // Send Enter to resume certbot process
  global.certbotProcess.stdin.write("\n");

  return NextResponse.json({ message: "Verification triggered. Certbot will continue issuing the certificate. Check logs for final status." });
}
