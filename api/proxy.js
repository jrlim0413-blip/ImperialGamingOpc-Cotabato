export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type, from, to, drawId, id } = req.query || {};
  const authBearer = process.env.VITE_AUTHORIZATION || '63211|6Jbvi41XijqCHw5eW2UpAvlbEGA8hOvsZHr1gZbV';

  let targetUrl = '';
  if (type === 'overall') {
    targetUrl = `https://stl-cotabato-api.com/api/accountant/OverAllReports?id=${id || 2}&from=${from}&to=${to}`;
  } else if (type === 'draw') {
    targetUrl = `https://stl-cotabato-api.com/api/accountant/GrossPerDraw?id=${id || 2}&drawId=${drawId}&from=${from}&to=${to}`;
  } else if (type === 'supervisor') {
    targetUrl = `https://stl-cotabato-api.com/api/accountant/AccountantSpvrWithGrossPerDraw?id=${id || 2}&from=${from}&drawId=${drawId || 4361}`;
  } else if (type === 'teller') {
    targetUrl = `https://stl-cotabato-api.com/api/accountant/TellerGrossPerDay?id=${id || 2}&from=${from}&to=${to}`;
  }

  if (!targetUrl) {
    return res.status(400).json({ error: 'Invalid or missing proxy request type' });
  }

  try {
    const apiRes = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${authBearer}`,
        Accept: 'application/json',
      },
    });

    const data = await apiRes.json();
    return res.status(apiRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Serverless proxy request failed' });
  }
}
