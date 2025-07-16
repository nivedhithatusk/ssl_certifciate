// pages/api/ssl/dns-verify.js

import dns from 'dns/promises';
import fs from 'fs/promises';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { challengeId } = req.body;

  try {
    const data = JSON.parse(await fs.readFile(`/tmp/challenge-${challengeId}.json`, 'utf8'));

    const records = await dns.resolveTxt(data.dnsDomain);
    const flat = records.flat().join('');

    if (flat === data.txtValue) {
      data.verified = true;
      await fs.writeFile(`/tmp/challenge-${challengeId}.json`, JSON.stringify(data));
      return res.status(200).json({ verified: true });
    }

    res.status(200).json({ verified: false, reason: 'TXT does not match' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
