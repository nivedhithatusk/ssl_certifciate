"use client"
import { useState } from "react";
import axios from "axios";

export default function SSLManagerPage() {
  const [domain, setDomain] = useState("");
  const [email, setEmail] = useState("");
  const [dnsRecord, setDnsRecord] = useState("");
  const [dnsType, setDnsType] = useState("");
  const [dnsValue, setDnsValue] = useState("");
  const [expectedValue, setExpectedValue] = useState("");
  const [step, setStep] = useState("input");
  const [message, setMessage] = useState("");

  const handlePrepare = async () => {
    try {
      const res = await axios.post("/api/ssl/prepare", { domain, email });
      setDnsRecord(res.data.dnsRecord);
      setDnsType(res.data.dnsType);
      setDnsValue(res.data.dnsValue);
      setExpectedValue(res.data.dnsValue);
      setStep("dns");
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to prepare challenge");
    }
  };

  const handleVerify = async () => {
    try {
      const res = await axios.post("/api/ssl/verify", { domain, expectedValue });
      setMessage("✅ Certificate issued! Check download section or contact support.");
      setStep("done");
    } catch (error) {
      setMessage(error.response?.data?.message || "Verification failed. Check DNS record again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">SSL Certificate Manager</h1>

      {step === "input" && (
        <>
          <input
            type="text"
            placeholder="Domain (example.com)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="border p-2 w-full mb-2"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 w-full mb-4"
          />
          <button
            onClick={handlePrepare}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Prepare DNS Challenge
          </button>
          {message && <p className="text-red-600 mt-2">{message}</p>}
        </>
      )}

      {step === "dns" && (
        <>
          <p className="mb-2">👉 Create this DNS record:</p>
          <div className="bg-gray-100 p-4 rounded mb-2">
            <p><strong>Name:</strong> {dnsRecord}</p>
            <p><strong>Type:</strong> {dnsType}</p>
            <p><strong>Value:</strong> {dnsValue}</p>
          </div>
          <p className="text-sm text-gray-500 mb-2">Once DNS is updated, click verify.</p>
          <button
            onClick={handleVerify}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Verify & Issue Certificate
          </button>
          {message && <p className="text-red-600 mt-2">{message}</p>}
        </>
      )}

      {step === "done" && (
        <div className="bg-green-100 p-4 rounded">
          <p>{message}</p>
          <p className="mt-2">✅ You can now download your cert from the server or contact admin.</p>
        </div>
      )}
    </div>
  );
}
