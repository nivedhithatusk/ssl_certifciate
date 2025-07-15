"use client";
import { useState } from "react";

export default function Page() {
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [txtRecord, setTxtRecord] = useState("");
  const [message, setMessage] = useState("");

  const generate = async () => {
    setMessage("Generating DNS challenge...");
    const res = await fetch("/api/generate-ssl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, email })
    });
    const data = await res.json();
    setMessage(data.error || "Add TXT record to DNS then click Verify");
    setTxtRecord(data.txtRecord || "");
  };

  const verify = async () => {
    setMessage("Verifying and issuing...");
    const res = await fetch("/api/verify-and-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, email })
    });
    const data = await res.json();
    setMessage(data.error || "✅ Certificate issued!");
  };

  return (
    <div>
      <h1>SSL Certificate Generator</h1>
      <input placeholder="domain.com" value={domain} onChange={e => setDomain(e.target.value)} />
      <input placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={generate}>Generate TXT</button>

      {txtRecord && (
        <>
          <pre>{txtRecord}</pre>
          <button onClick={verify}>Verify & Issue</button>
        </>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}
