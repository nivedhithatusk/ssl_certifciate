'use client';

import { useState } from 'react';

export default function SSLPage() {
  const [step, setStep] = useState(1);
  const [challengeId, setChallengeId] = useState('');
  const [dnsData, setDnsData] = useState({});

  async function handleGenerate() {
    const res = await fetch('/api/ssl/dns-txt-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'example.com', email: 'user@example.com' }),
    });
    const data = await res.json();
    setChallengeId(data.challengeId);
    setDnsData(data);
    setStep(2);
  }

  async function handleVerify() {
    const res = await fetch('/api/ssl/dns-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId }),
    });
    const result = await res.json();
    if (result.verified) setStep(3);
    else alert('Verification failed: ' + result.reason);
  }

  async function handleGenerateCert() {
    const res = await fetch('/api/ssl/generate-certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId }),
    });
    const result = await res.json();
    if (result.success) {
      alert('Certificate created:\n' +
        `Cert: ${result.certPath}\nKey: ${result.keyPath}`);
    } else {
      alert('Failed to generate certificate: ' + result.error);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      {step === 1 && <button onClick={handleGenerate}>1️⃣ Generate DNS TXT Record</button>}

      {step === 2 && (
        <>
          <p>👉 Add this DNS TXT record to your DNS provider:</p>
          <p><b>Name:</b> {dnsData.dnsName}</p>
          <p><b>Value:</b> {dnsData.dnsValue}</p>
          <button onClick={handleVerify}>2️⃣ Verify DNS</button>
        </>
      )}

      {step === 3 && (
        <>
          <p>✅ DNS Verified!</p>
          <button onClick={handleGenerateCert}>3️⃣ Generate SSL Certificate</button>
        </>
      )}
    </div>
  );
}
