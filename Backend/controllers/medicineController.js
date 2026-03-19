// backend/controllers/medicineController.js
const Medicine = require('../models/Medicine');

exports.getAll = (req, res) => {
  try {
    const { search = '', category = '', status = '' } = req.query;
    const medicines = Medicine.getAll({ search, category, status });
    res.json({ success: true, count: medicines.length, data: medicines });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch medicines', error: err.message });
  }
};

exports.getStats = (req, res) => {
  try {
    const stats = Medicine.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: err.message });
  }
};

exports.getAlerts = (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const expiringSoon = Medicine.getExpiringSoon(days);
    const expired = Medicine.getExpired();
    res.json({ success: true, data: { expired, expiring_soon: expiringSoon, total_alerts: expired.length + expiringSoon.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch alerts', error: err.message });
  }
};

exports.getOne = (req, res) => {
  try {
    const medicine = Medicine.getById(parseInt(req.params.id));
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    res.json({ success: true, data: medicine });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch medicine', error: err.message });
  }
};

exports.create = (req, res) => {
  try {
    const medicine = Medicine.create(req.body);
    res.status(201).json({ success: true, message: 'Medicine added successfully', data: medicine });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add medicine', error: err.message });
  }
};

exports.update = (req, res) => {
  try {
    const medicine = Medicine.update(parseInt(req.params.id), req.body);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    res.json({ success: true, message: 'Medicine updated successfully', data: medicine });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update medicine', error: err.message });
  }
};

exports.remove = (req, res) => {
  try {
    const deleted = Medicine.delete(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ success: false, message: 'Medicine not found' });
    res.json({ success: true, message: 'Medicine deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete medicine', error: err.message });
  }
};
