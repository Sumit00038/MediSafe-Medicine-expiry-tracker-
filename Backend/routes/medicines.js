// backend/routes/medicines.js
const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const ctrl = require('../controllers/medicineController');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

const medicineRules = [
  body('name').trim().notEmpty().withMessage('Medicine name is required').isLength({ max: 200 }),
  body('expiry').notEmpty().withMessage('Expiry date is required').isISO8601().withMessage('Expiry must be YYYY-MM-DD'),
  body('category').optional().isIn(['tablet','capsule','syrup','injection','drops','cream','other']),
  body('quantity').optional().isLength({ max: 50 }),
  body('manufacture').optional().isISO8601().withMessage('Manufacture date must be valid'),
  body('manufacturer').optional().trim().isLength({ max: 200 }),
  body('location').optional().trim().isLength({ max: 200 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
];

router.get('/stats',  ctrl.getStats);
router.get('/alerts', ctrl.getAlerts);
router.get('/',       ctrl.getAll);
router.get('/:id',    param('id').isInt({ min: 1 }), validate, ctrl.getOne);
router.post('/',      medicineRules, validate, ctrl.create);
router.put('/:id',    [param('id').isInt({ min: 1 }), ...medicineRules], validate, ctrl.update);
router.delete('/:id', param('id').isInt({ min: 1 }), validate, ctrl.remove);

module.exports = router;
