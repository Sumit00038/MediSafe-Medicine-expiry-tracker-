
// =====================================================
// MediSafe API Configuration
// =====================================================
// 🔧 IMPORTANT: After deploying backend to Railway,
//    replace the URL below with your Railway app URL.
//    Example: https://medisafe-backend-production.up.railway.app
// =====================================================

const BASE_URL = "https://YOUR-RAILWAY-APP-URL.up.railway.app";

// ---- DO NOT EDIT BELOW THIS LINE ----

const API = {
  health: () => `${BASE_URL}/api/health`,
  medicines: () => `${BASE_URL}/api/medicines`,
  medicineById: (id) => `${BASE_URL}/api/medicines/${id}`,
  stats: () => `${BASE_URL}/api/medicines/stats`,
  alerts: () => `${BASE_URL}/api/medicines/alerts`,
};

// Generic fetch helper
async function apiFetch(url, options = {}) {
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  const response = await fetch(url, { ...defaultOptions, ...options });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// ---- API functions ----

async function getAllMedicines(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${API.medicines()}?${query}` : API.medicines();
  return apiFetch(url);
}

async function getMedicineById(id) {
  return apiFetch(API.medicineById(id));
}

async function createMedicine(data) {
  return apiFetch(API.medicines(), {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function updateMedicine(id, data) {
  return apiFetch(API.medicineById(id), {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

async function deleteMedicine(id) {
  return apiFetch(API.medicineById(id), {
    method: "DELETE",
  });
}

async function getStats() {
  return apiFetch(API.stats());
}

async function getAlerts() {
  return apiFetch(API.alerts());
}
