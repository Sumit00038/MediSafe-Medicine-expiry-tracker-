# 💊 MediSafe — Medicine Expiry Tracker

A full-stack web application to track medicines at home or clinic with real-time expiry alerts.

---

## 📁 Project Structure

```
medisafe/
├── backend/
│   ├── server.js               ← Express entry point
│   ├── package.json
│   ├── .env
│   ├── config/
│   │   └── database.js         ← SQLite init & schema & seeding
│   ├── models/
│   │   └── Medicine.js         ← All DB queries
│   ├── controllers/
│   │   └── medicineController.js
│   ├── routes/
│   │   └── medicines.js        ← Routes + validation
│   ├── middleware/
│   │   └── errorHandler.js
│   └── database/
│       └── medisafe.db         ← Auto-created on first run
│
└── frontend/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        ├── api.js
        └── app.js
```

---

## 🚀 Quick Start

### Step 1 — Install & start backend

```bash
cd backend
npm install
node server.js
```

Server starts at → **http://localhost:3000**

The SQLite database is auto-created at `backend/database/medisafe.db` and pre-seeded with 10 sample medicines.

### Step 2 — Open frontend

Option A — Direct file:
```
Open frontend/index.html in your browser
```

Option B — Local server (recommended, avoids CORS):
```bash
cd frontend
npx serve .             # needs Node.js
# OR
python3 -m http.server 5500
```

Then open → **http://localhost:5500**

---

## 🔌 API Reference

| Method | Endpoint                    | Description                      |
|--------|-----------------------------|----------------------------------|
| GET    | `/api/health`               | Health check                     |
| GET    | `/api/medicines`            | List all (supports filters)      |
| GET    | `/api/medicines/stats`      | Total / safe / warn / expired    |
| GET    | `/api/medicines/alerts`     | Expired + expiring soon          |
| GET    | `/api/medicines/:id`        | Single medicine                  |
| POST   | `/api/medicines`            | Add new                          |
| PUT    | `/api/medicines/:id`        | Update existing                  |
| DELETE | `/api/medicines/:id`        | Delete                           |

### Query params for GET /api/medicines

| Param      | Description                                    |
|------------|------------------------------------------------|
| `search`   | Search name, manufacturer, location            |
| `category` | tablet / capsule / syrup / injection / drops / cream / other |
| `status`   | safe / warn / expired                          |

---

## 🗄️ Database Schema

```sql
CREATE TABLE medicines (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  category     TEXT    NOT NULL DEFAULT 'tablet',
  quantity     TEXT,
  manufacture  TEXT,       -- YYYY-MM-DD
  expiry       TEXT NOT NULL,  -- YYYY-MM-DD
  manufacturer TEXT,
  location     TEXT,
  notes        TEXT,
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);
```

Status is computed at runtime:
- `safe`    → expires in > 30 days  
- `warn`    → expires in 1–30 days  
- `expired` → expiry date passed

---

## 🔔 Browser Notifications

1. Click **Enable Alerts** in header
2. Allow browser permission
3. Get notified about:
   - 🚨 Expiring within 7 days
   - ⚠️ Expiring within 30 days
   - ❌ Already expired medicines

Checks repeat every 6 hours automatically.

---

## ⚙️ Environment Variables

Edit `backend/.env`:

```env
PORT=3000
NODE_ENV=development
DB_PATH=./database/medisafe.db
CORS_ORIGIN=*
```

---

## 🛠️ Tech Stack

| Layer      | Tech                                        |
|------------|---------------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JS (ES6+)              |
| Backend    | Node.js + Express 4                         |
| Database   | SQLite via `better-sqlite3`                 |
| Validation | `express-validator`                         |
| Security   | `helmet`, `cors`, `express-rate-limit`      |
| Fonts      | Outfit + JetBrains Mono (Google Fonts)      |
