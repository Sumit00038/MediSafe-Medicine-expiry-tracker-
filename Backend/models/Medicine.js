// backend/models/Medicine.js
const { getDB } = require('../config/database');

class Medicine {

  static getAll({ search = '', category = '', status = '' } = {}) {
    const db = getDB();
    let sql = `SELECT * FROM medicines WHERE 1=1`;
    const params = [];

    if (search) {
      sql += ` AND (name LIKE ? OR manufacturer LIKE ? OR location LIKE ?)`;
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (category && category !== 'all') {
      sql += ` AND category = ?`;
      params.push(category);
    }

    sql += ` ORDER BY expiry ASC`;
    let rows = db.prepare(sql).all(...params);

    if (status && status !== 'all') {
      rows = rows.filter(r => Medicine.computeStatus(r.expiry) === status);
    }
    return rows.map(Medicine.enrich);
  }

  static getById(id) {
    const db = getDB();
    const row = db.prepare('SELECT * FROM medicines WHERE id = ?').get(id);
    return row ? Medicine.enrich(row) : null;
  }

  static create(data) {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO medicines (name, category, quantity, manufacture, expiry, manufacturer, location, notes)
      VALUES (@name, @category, @quantity, @manufacture, @expiry, @manufacturer, @location, @notes)
    `);
    const result = stmt.run({
      name:         data.name,
      category:     data.category     || 'tablet',
      quantity:     data.quantity     || null,
      manufacture:  data.manufacture  || null,
      expiry:       data.expiry,
      manufacturer: data.manufacturer || null,
      location:     data.location     || null,
      notes:        data.notes        || null,
    });
    return Medicine.getById(result.lastInsertRowid);
  }

  static update(id, data) {
    const db = getDB();
    const existing = Medicine.getById(id);
    if (!existing) return null;

    const stmt = db.prepare(`
      UPDATE medicines SET
        name         = @name,
        category     = @category,
        quantity     = @quantity,
        manufacture  = @manufacture,
        expiry       = @expiry,
        manufacturer = @manufacturer,
        location     = @location,
        notes        = @notes,
        updated_at   = datetime('now')
      WHERE id = @id
    `);
    stmt.run({
      id,
      name:         data.name         ?? existing.name,
      category:     data.category     ?? existing.category,
      quantity:     data.quantity     ?? existing.quantity,
      manufacture:  data.manufacture  ?? existing.manufacture,
      expiry:       data.expiry       ?? existing.expiry,
      manufacturer: data.manufacturer ?? existing.manufacturer,
      location:     data.location     ?? existing.location,
      notes:        data.notes        ?? existing.notes,
    });
    return Medicine.getById(id);
  }

  static delete(id) {
    const db = getDB();
    const result = db.prepare('DELETE FROM medicines WHERE id = ?').run(id);
    return result.changes > 0;
  }

  static getStats() {
    const all = Medicine.getAll();
    const stats = { total: 0, safe: 0, warn: 0, expired: 0 };
    all.forEach(m => { stats.total++; stats[m.status]++; });
    return stats;
  }

  static getExpiringSoon(days = 30) {
    const db = getDB();
    const today = new Date().toISOString().split('T')[0];
    const future = new Date();
    future.setDate(future.getDate() + days);
    const futureStr = future.toISOString().split('T')[0];
    const rows = db.prepare(`SELECT * FROM medicines WHERE expiry BETWEEN ? AND ? ORDER BY expiry ASC`).all(today, futureStr);
    return rows.map(Medicine.enrich);
  }

  static getExpired() {
    const db = getDB();
    const today = new Date().toISOString().split('T')[0];
    const rows = db.prepare(`SELECT * FROM medicines WHERE expiry < ? ORDER BY expiry ASC`).all(today);
    return rows.map(Medicine.enrich);
  }

  static computeStatus(expiryStr) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryStr); exp.setHours(0, 0, 0, 0);
    const days = Math.round((exp - today) / 86400000);
    if (days < 0)  return 'expired';
    if (days <= 30) return 'warn';
    return 'safe';
  }

  static computeDays(expiryStr) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryStr); exp.setHours(0, 0, 0, 0);
    return Math.round((exp - today) / 86400000);
  }

  static enrich(row) {
    return { ...row, days_until_expiry: Medicine.computeDays(row.expiry), status: Medicine.computeStatus(row.expiry) };
  }
}

module.exports = Medicine;
