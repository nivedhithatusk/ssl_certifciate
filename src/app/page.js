// src/app/page.js
"use client";

import { useState } from "react";

export default function Home() {
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [txtRecord, setTxtRecord] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("Generating DNS TXT record...");

    const response = await fetch("/api/generate-ssl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, email }),
    });

    const data = await response.json();

    if (data.success) {
      setMessage("DNS TXT record generated successfully!");
      setTxtRecord(data.txtRecord);
    } else {
      setMessage("Error generating DNS TXT record: " + data.error);
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    setLoading(true);
    setMessage("Verifying DNS TXT record and generating SSL...");

    const response = await fetch("/api/verify-and-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });

    const data = await response.json();

    if (data.success) {
      setMessage("SSL certificate generated successfully!");
    } else {
      setMessage("Error: " + data.error);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h1>SSL Certificate Generator</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <div>
          <label>Domain:</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 10 }}
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", marginBottom: 10 }}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate TXT Record"}
        </button>
      </form>

      {message && <p>{message}</p>}

      {txtRecord && (
        <div>
          <h3>DNS TXT Record</h3>
          <pre
            style={{
              backgroundColor: "#eee",
              padding: 10,
              borderRadius: 4,
              overflowX: "auto",
            }}
          >
            {txtRecord}
          </pre>
          <p>Please add this TXT record to your DNS provider.</p>
          <button onClick={handleVerify} disabled={loading}>
            {loading ? "Verifying..." : "Verify DNS Record and Generate SSL"}
          </button>
        </div>
      )}
    </div>
  );
}
