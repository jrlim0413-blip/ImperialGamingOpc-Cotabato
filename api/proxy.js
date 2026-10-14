export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://snemagtefsfuagzdhzmq.supabase.co';
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZW1hZ3RlZnNmdWFnemRoem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MDg4NjgsImV4cCI6MjEwNzM4NDg2OH0.Pym6MwNdX9vMDk-zbOGqCqfCjYUZqxMl9kpkwQfTo_A';
  const authBearer = process.env.VITE_AUTHORIZATION || '63211|6Jbvi41XijqCHw5eW2UpAvlbEGA8hOvsZHr1gZbV';

  const supaHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  const { action, type, from, to, drawId, id, token } = req.query || {};

  // 1. Unified Cloud Boot / Database Proxy
  if (action === 'boot') {
    try {
      const [matrixRes, commRes, usersRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.matrix_config&select=config`, { headers: supaHeaders }),
        fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.commissions_config&select=config`, { headers: supaHeaders }),
        fetch(`${SUPABASE_URL}/rest/v1/rbac_users?select=*&order=created_at.desc`, { headers: supaHeaders }),
      ]);
      const matrixData = await matrixRes.json();
      const commData = await commRes.json();
      const usersData = await usersRes.json();

      let sessionUser = null;
      if (token) {
        const sesRes = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.active_sessions&select=config`, { headers: supaHeaders });
        const sesData = await sesRes.json();
        if (sesData?.[0]?.config?.[token]) {
          sessionUser = sesData[0].config[token];
        }
      }

      return res.status(200).json({
        success: true,
        matrix: matrixData?.[0]?.config || null,
        commissions: commData?.[0]?.config || null,
        users: Array.isArray(usersData) ? usersData : [],
        sessionUser,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (action === 'save_matrix') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config`, {
        method: 'POST',
        headers: { ...supaHeaders, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          id: 'matrix_config',
          config: body,
          updated_at: new Date().toISOString(),
        }),
      });
      return res.status(r.status).json({ success: r.ok });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (action === 'save_commissions') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config`, {
        method: 'POST',
        headers: { ...supaHeaders, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          id: 'commissions_config',
          config: body,
          updated_at: new Date().toISOString(),
        }),
      });
      return res.status(r.status).json({ success: r.ok });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (action === 'create_session') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const sesRes = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.active_sessions&select=config`, { headers: supaHeaders });
      const sesData = await sesRes.json();
      const current = sesData?.[0]?.config || {};
      current[body.token] = body;

      await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config`, {
        method: 'POST',
        headers: { ...supaHeaders, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          id: 'active_sessions',
          config: current,
          updated_at: new Date().toISOString(),
        }),
      });
      return res.status(200).json({ success: true, session: body });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (action === 'revoke_session') {
    try {
      const targetToken = token || (typeof req.body === 'object' ? req.body?.token : null);
      if (targetToken) {
        const sesRes = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.active_sessions&select=config`, { headers: supaHeaders });
        const sesData = await sesRes.json();
        const current = sesData?.[0]?.config || {};
        delete current[targetToken];

        await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config`, {
          method: 'POST',
          headers: { ...supaHeaders, 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({
            id: 'active_sessions',
            config: current,
            updated_at: new Date().toISOString(),
          }),
        });
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. STL Reports Proxy
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

  if (targetUrl) {
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

  return res.status(400).json({ error: 'Invalid or missing proxy request type/action' });
}
