const express = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/rbac');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get comprehensive analytics metrics, KPIs, and chart series for admin dashboard
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema: { type: string, enum: [today, yesterday, 7d, 30d, custom], default: 30d }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Dashboard overview KPIs and chart breakdowns
 */
router.get(
  '/dashboard',
  requirePermission('dashboard:read'),
  analyticsController.getDashboardMetrics
);

module.exports = router;
