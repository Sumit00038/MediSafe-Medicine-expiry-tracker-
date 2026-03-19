// frontend/js/app.js
let allMeds = [], currentFilter = 'all', editId = null, deleteId = null;
let notifGranted = false, notifInterval = null, isOnline = false;

document.addEventListener('DOMContentLoaded', async () => {
  await initConnection();
  await loadAndRender();
  initNotifStatus();
  setInterval(pollConnection, 10000);
  // Animate stats on load
  setTimeout(() => document.querySelectorAll('.stat-card').forEach((c,i) => {
    c.style.animationDelay = `${i * 80}ms`;
    c.classList.add('animate-in');
  }), 100);
});

async function initConnection() {
  isOnline = await checkConnection();
  updateConnectionUI();
}

async function pollConnection() {
  const prev = isOnline;
  isOnline = await checkConnection();
  updateConnectionUI();
  if (!prev && isOnline)  { showToast('🟢 Connected to server', 'success'); await loadAndRender(); }
  if (prev && !isOnline)    showToast('🔴 Server disconnected', 'error');
}

function updateConnectionUI() {
  const el = document.getElementById('connectionStatus');
  if (!el) return;
  el.className = 'connection-badge ' + (isOnline ? 'online' : 'offline');
  el.innerHTML = `<span class="dot"></span>${isOnline ? 'Live' : 'Offline'}`;
}

async function loadAndRender() {
  if (!isOnline) { renderOfflineBanner(); return; }
  try {
    showTableLoading();
    const params = {};
    if (currentFilter !== 'all') params.status = currentFilter;
    const q = document.getElementById('searchInput')?.value?.trim();
    if (q) params.search = q;

    const [medsRes, statsRes] = await Promise.all([MedicineAPI.getAll(params), MedicineAPI.getStats()]);
    allMeds = medsRes.data;
    renderStats(statsRes.data);
    renderTable(allMeds);
    if (notifGranted) checkExpiryNotifications(allMeds);
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
    renderTableError(err.message);
  }
}

function renderStats(stats) {
  animateCount('statTotal',   stats.total   || 0);
  animateCount('statSafe',    stats.safe    || 0);
  animateCount('statWarn',    stats.warn    || 0);
  animateCount('statExpired', stats.expired || 0);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const dur = 600, step = 16;
  const diff = target - start;
  let elapsed = 0;
  const timer = setInterval(() => {
    elapsed += step;
    const progress = Math.min(elapsed / dur, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + diff * ease);
    if (progress >= 1) clearInterval(timer);
  }, step);
}

function showTableLoading() {
  document.getElementById('tableBody').innerHTML =
    `<tr><td colspan="7"><div class="loader-wrap"><div class="pulse-loader"><span></span><span></span><span></span></div><p>Loading medicines…</p></div></td></tr>`;
  document.getElementById('emptyState').style.display = 'none';
}

function renderTableError(msg) {
  document.getElementById('tableBody').innerHTML =
    `<tr><td colspan="7" class="msg-cell error-msg">⚠️ ${escHtml(msg)}</td></tr>`;
}

function renderOfflineBanner() {
  document.getElementById('tableBody').innerHTML =
    `<tr><td colspan="7" class="msg-cell">
      <div class="offline-banner">
        <div class="offline-icon">🔴</div>
        <h3>Backend Offline</h3>
        <p>Start the server with:</p>
        <code>cd backend &amp;&amp; npm install &amp;&amp; node server.js</code>
      </div>
    </td></tr>`;
}

function renderTable(meds) {
  const tbody = document.getElementById('tableBody');
  const empty = document.getElementById('emptyState');
  if (!meds || meds.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = meds.map((m, idx) => {
    const days = m.days_until_expiry;
    const s = m.status;
    const rowCls = s === 'expired' ? 'row-expired' : s === 'warn' ? 'row-warn' : '';
    return `<tr class="${rowCls}" style="animation-delay:${idx * 30}ms">
      <td>
        <div class="med-name">${escHtml(m.name)}</div>
        ${m.manufacturer ? `<div class="med-sub">${escHtml(m.manufacturer)}</div>` : ''}
        ${m.notes ? `<div class="med-note" title="${escHtml(m.notes)}">${escHtml(m.notes)}</div>` : ''}
      </td>
      <td><span class="cat-badge cat-${escHtml(m.category)}">${escHtml(m.category)}</span></td>
      <td>
        <div class="expiry-info">${formatExpiry(m.expiry, days)}</div>
        ${expiryBarHTML(days)}
      </td>
      <td>${statusBadge(s)}</td>
      <td><span class="location-txt">${escHtml(m.location||'—')}</span></td>
      <td><span class="qty-txt">${m.quantity || '—'}</span></td>
      <td>
        <div class="actions">
          <button class="btn-icon edit" title="Edit" onclick="editMedicine(${m.id})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon del" title="Delete" onclick="openDelModal(${m.id})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  // Trigger row animations
  requestAnimationFrame(() => {
    tbody.querySelectorAll('tr').forEach(tr => tr.classList.add('row-visible'));
  });
}

async function saveMedicine() {
  const name = document.getElementById('fName').value.trim();
  const exp  = document.getElementById('fExp').value;
  if (!name) { showToast('⚠️ Medicine name is required', 'warn'); shakeInput('fName'); return; }
  if (!exp)  { showToast('⚠️ Expiry date is required', 'warn');   shakeInput('fExp');  return; }

  const payload = {
    name,
    category:     document.getElementById('fCat').value,
    quantity:     document.getElementById('fQty').value  || undefined,
    manufacture:  document.getElementById('fMfg').value  || undefined,
    expiry:       exp,
    manufacturer: document.getElementById('fMfr').value.trim() || undefined,
    location:     document.getElementById('fLoc').value.trim() || undefined,
    notes:        document.getElementById('fNotes').value.trim() || undefined,
  };

  const btn = document.querySelector('.btn-primary');
  btn.disabled = true;
  btn.textContent = editId ? 'Updating…' : 'Adding…';

  try {
    if (editId !== null) {
      await MedicineAPI.update(editId, payload);
      showToast('✅ Medicine updated', 'success');
      cancelEdit();
    } else {
      await MedicineAPI.create(payload);
      showToast('✅ Medicine added', 'success');
      clearForm();
    }
    await loadAndRender();
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = editId ? 'Update Medicine' : 'Add Medicine';
  }
}

function shakeInput(id) {
  const el = document.getElementById(id);
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

function editMedicine(id) {
  const m = allMeds.find(x => x.id === id);
  if (!m) return;
  editId = id;
  document.getElementById('fName').value  = m.name;
  document.getElementById('fCat').value   = m.category;
  document.getElementById('fQty').value   = m.quantity  || '';
  document.getElementById('fMfg').value   = m.manufacture || '';
  document.getElementById('fExp').value   = m.expiry;
  document.getElementById('fMfr').value   = m.manufacturer || '';
  document.getElementById('fLoc').value   = m.location  || '';
  document.getElementById('fNotes').value = m.notes     || '';

  document.getElementById('formTitle').textContent  = '✏️ Edit Medicine';
  document.querySelector('.btn-primary').textContent = 'Update Medicine';
  document.getElementById('editNote').style.display  = 'flex';
  document.getElementById('cancelBtn').style.display = 'block';
  document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('fName').focus();
}

function cancelEdit() {
  editId = null;
  clearForm();
  document.getElementById('formTitle').textContent  = '➕ Add Medicine';
  document.querySelector('.btn-primary').textContent = 'Add Medicine';
  document.getElementById('editNote').style.display  = 'none';
  document.getElementById('cancelBtn').style.display = 'none';
}

function clearForm() {
  ['fName','fQty','fMfg','fExp','fMfr','fLoc','fNotes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('fCat').value = 'tablet';
}

function openDelModal(id) {
  deleteId = id;
  const m = allMeds.find(x => x.id === id);
  if (m) document.getElementById('delMedName').textContent = m.name;
  document.getElementById('delModal').classList.add('open');
}
function closeDelModal() {
  deleteId = null;
  document.getElementById('delModal').classList.remove('open');
}
async function confirmDelete() {
  if (deleteId === null) return;
  try {
    await MedicineAPI.delete(deleteId);
    showToast('🗑️ Medicine deleted', 'error');
    closeDelModal();
    await loadAndRender();
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  }
}
document.getElementById('delModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('delModal')) closeDelModal();
});

function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  loadAndRender();
}

function initNotifStatus() {
  if (Notification.permission === 'granted') { notifGranted = true; updateNotifBtn(true); }
}

async function toggleNotifications() {
  if (!('Notification' in window)) { showToast('❌ Notifications not supported', 'error'); return; }
  if (Notification.permission === 'granted') {
    notifGranted = true; updateNotifBtn(true);
    showToast('🔔 Notifications already enabled!', 'success');
    if (allMeds.length) checkExpiryNotifications(allMeds);
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    notifGranted = true; updateNotifBtn(true);
    showToast('🔔 Notifications enabled!', 'success');
    if (allMeds.length) checkExpiryNotifications(allMeds);
    if (!notifInterval) notifInterval = setInterval(() => { if (allMeds.length) checkExpiryNotifications(allMeds); }, 6 * 3600 * 1000);
  } else {
    showToast('❌ Notification permission denied', 'error');
  }
}

function updateNotifBtn(active) {
  const btn = document.getElementById('notifBtn');
  if (!btn) return;
  btn.classList.toggle('active', active);
  btn.innerHTML = active ? `<span class="bell-icon">🔔</span> Alerts ON` : `<span class="bell-icon">🔔</span> Enable Alerts`;
}

function checkExpiryNotifications(meds) {
  if (!notifGranted) return;
  meds.forEach(m => {
    const d = m.days_until_expiry;
    if (d < 0)       sendNotif(`❌ Expired: ${m.name}`, `Expired ${Math.abs(d)}d ago.`, 'expired');
    else if (d <= 7)  sendNotif(`🚨 ${d}d left: ${m.name}`, `Expires ${new Date(m.expiry).toLocaleDateString()}.`, 'danger');
    else if (d <= 30) sendNotif(`⚠️ Expiring soon: ${m.name}`, `Expires in ${d} days.`, 'warn');
  });
}

function sendNotif(title, body, type) {
  if (!notifGranted) return;
  new Notification(title, { body, tag: `medisafe-${title}`, requireInteraction: type !== 'warn' });
}

function formatExpiry(expiryStr, days) {
  const date = new Date(expiryStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  if (days < 0)   return `<span class="exp-date danger">${date}</span><span class="exp-days">${Math.abs(days)}d ago</span>`;
  if (days === 0) return `<span class="exp-date danger">${date}</span><span class="exp-days danger">Today!</span>`;
  if (days <= 30) return `<span class="exp-date warn">${date}</span><span class="exp-days">${days}d left</span>`;
  return `<span class="exp-date">${date}</span><span class="exp-days">${days}d left</span>`;
}

function expiryBarHTML(days) {
  const pct = Math.min(100, Math.max(0, (days / 365) * 100));
  const color = days < 0 ? 'var(--danger)' : days <= 30 ? 'var(--warn)' : 'var(--safe)';
  return `<div class="expiry-bar"><div class="expiry-bar-fill" style="width:${pct}%;background:${color}"></div></div>`;
}

function statusBadge(s) {
  const map = { expired: ['❌','Expired','expired'], warn: ['⚠️','Soon','warn'], safe: ['✅','Safe','safe'] };
  const [icon, label, cls] = map[s] || ['?', s, s];
  return `<span class="badge ${cls}">${icon} ${label}</span>`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg, type = 'success') {
  const tc = document.getElementById('toast-container');
  const t  = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-msg">${msg}</span><button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
  tc.appendChild(t);
  setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 400); }, 3500);
}
