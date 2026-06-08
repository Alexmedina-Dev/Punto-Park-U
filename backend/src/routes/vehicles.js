const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const requireAuth = require('../middleware/requireAuth');

// All vehicle routes require authentication
router.use(requireAuth);

// GET /api/vehicles — List vehicles
router.get('/', vehicleController.getVehicles);

// POST /api/vehicles — Register a new vehicle
router.post('/', vehicleController.createVehicle);

// GET /api/vehicles/:id — Get vehicle details
router.get('/:id', vehicleController.getVehicle);

// PUT /api/vehicles/:id — Update vehicle
router.put('/:id', vehicleController.updateVehicle);

// DELETE /api/vehicles/:id — Delete vehicle
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
