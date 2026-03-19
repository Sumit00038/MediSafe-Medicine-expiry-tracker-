// backend/config/database.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './database/medisafe.db';

const dbDir = path.dirname(path.resolve(DB_PATH));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

function getDB() {
  if (!db) {
    db = new Database(path.resolve(DB_PATH));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS medicines (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      category     TEXT    NOT NULL DEFAULT 'tablet',
      quantity     TEXT,
      manufacture  TEXT,
      expiry       TEXT    NOT NULL,
      manufacturer TEXT,
      location     TEXT,
      notes        TEXT,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_medicines_expiry   ON medicines(expiry);
    CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);
    CREATE INDEX IF NOT EXISTS idx_medicines_name     ON medicines(name);

    CREATE TABLE IF NOT EXISTS notification_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER REFERENCES medicines(id) ON DELETE CASCADE,
      type        TEXT    NOT NULL,
      sent_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
  seedIfEmpty();
}

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM medicines').get().c;
  if (count > 0) return;

  const today = new Date();
  const d = (offset) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().split('T')[0];
  };

  const insert = db.prepare(`
    INSERT INTO medicines (name, category, quantity, manufacture, expiry, manufacturer, location, notes)
    VALUES (@name, @category, @quantity, @manufacture, @expiry, @manufacturer, @location, @notes)
  `);

  const seeds = [
    { name: 'Paracetamol 500mg',    category: 'tablet',    quantity: '20', manufacture: d(-180), expiry: d(180),  manufacturer: 'Cipla Ltd.',     location: 'Cabinet A',       notes: 'For fever & mild pain'     },
    { name: 'Amoxicillin 250mg',    category: 'capsule',   quantity: '10', manufacture: d(-300), expiry: d(-5),   manufacturer: 'Sun Pharma',     location: 'Cabinet A',       notes: 'Antibiotic course'         },
    { name: 'Azithromycin Syrup',   category: 'syrup',     quantity: '1',  manufacture: d(-90),  expiry: d(15),   manufacturer: 'Pfizer',         location: 'Fridge',          notes: '5ml twice daily'           },
    { name: 'Insulin Glargine',     category: 'injection', quantity: '3',  manufacture: d(-60),  expiry: d(90),   manufacturer: 'Novo Nordisk',   location: 'Fridge (2-8°C)', notes: '20 units at night'         },
    { name: 'Betadine Eye Drops',   category: 'drops',     quantity: '1',  manufacture: d(-200), expiry: d(25),   manufacturer: 'Meda Pharma',    location: 'Medicine Bag',    notes: '2 drops twice daily'       },
    { name: 'Clobetasol Cream',     category: 'cream',     quantity: '2',  manufacture: d(-100), expiry: d(265),  manufacturer: 'GSK',            location: 'Drawer',          notes: 'Apply thin layer'          },
    { name: 'Metformin 500mg',      category: 'tablet',    quantity: '60', manufacture: d(-120), expiry: d(240),  manufacturer: 'USV Ltd.',       location: 'Cabinet B',       notes: 'With meals, twice daily'   },
    { name: 'Cetirizine 10mg',      category: 'tablet',    quantity: '15', manufacture: d(-400), expiry: d(-30),  manufacturer: 'Mankind Pharma', location: 'Cabinet A',       notes: 'Antihistamine for allergy' },
    { name: 'Vitamin D3 60K',       category: 'capsule',   quantity: '4',  manufacture: d(-30),  expiry: d(335),  manufacturer: 'HealthKart',     location: 'Cabinet B',       notes: 'Once weekly'               },
    { name: 'ORS Sachets',          category: 'other',     quantity: '10', manufacture: d(-10),  expiry: d(720),  manufacturer: 'Electral',       location: 'Cabinet A',       notes: 'For dehydration'           },
  ];

  const insertMany = db.transaction((rows) => { for (const r of rows) insert.run(r); });
  insertMany(seeds);
  console.log('✅ Database seeded with sample medicines');
}

module.exports = { getDB };
