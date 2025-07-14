// src/app/api/generate-ssl/route.js

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { domain, email } = await request.json();

    if (!domain || !email) {
      return NextResponse.json(
        { success: false, error: "Domain and Email are required" },
        { status: 400 }
      );
    }

    // For example: generate a fake TXT record (replace with real logic)
    // In real case, generate DNS challenge TXT record using certbot --manual or acme lib
    const txtRecord = `_acme-challenge.${domain} 300 IN TXT "fake-txt-challenge-token"`;

    // Return the TXT record string to the frontend
    return NextResponse.json({ success: true, txtRecord });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
