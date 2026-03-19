// frontend/js/api.js
const API_BASE = 'http://localhost:3000/api';

async function request(method, path, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) {
    const msg = data.errors ? data.errors.map(e => e.msg).join(', ') : data.message || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

const MedicineAPI = {
  getAll(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/medicines${qs ? '?' + qs : ''}`);
  },
  getOne(id)       { return request('GET',    `/medicines/${id}`); },
  getStats()       { return request('GET',    `/medicines/stats`); },
  getAlerts(days)  { return request('GET',    `/medicines/alerts?days=${days||30}`); },
  create(data)     { return request('POST',   `/medicines`, data); },
  update(id, data) { return request('PUT',    `/medicines/${id}`, data); },
  delete(id)       { return request('DELETE', `/medicines/${id}`); },
  health()         { return request('GET',    `/health`); },
};

async function checkConnection() {
  try { await MedicineAPI.health(); return true; }
  catch { return false; }
}
