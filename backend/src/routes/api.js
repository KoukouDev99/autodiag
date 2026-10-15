const express = require('express');
const router = express.Router();

const systemRoutes = require('./system');
const vehicleRoutes = require('./vehicles');
const catalogRoutes = require('./catalog');
const dtcRoutes = require('./dtc');
const diagnosticRoutes = require('./diagnostics');
const aiRoutes = require('./ai');

// Mount modular sub-routers preserving flat /api/... structure for 100% frontend compatibility
router.use('/', systemRoutes);
router.use('/', vehicleRoutes);
router.use('/', catalogRoutes);
router.use('/', dtcRoutes);
router.use('/', diagnosticRoutes);
router.use('/', aiRoutes);

module.exports = router;
