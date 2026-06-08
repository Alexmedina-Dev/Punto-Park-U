const ParkingSpot = require('../models/ParkingSpot');
const { getMQTTStatus } = require('../services/mqttService');
const { getAllBarriers, getBarrierStatus, openBarrier, closeBarrier, simulateBarrierAction } = require('../services/barrierService');
const { emitBarrierStatus } = require('../services/socketService');
const { capturePlate, checkCameraHealth, processCameraEntry } = require('../services/cameraService');
const { emitCameraResult } = require('../services/socketService');

// ── GET /api/hardware/sensors ────────────────────────────────────────
const getSensors = async (req, res, next) => {
  try {
    const spots = await ParkingSpot.find({})
      .select('code zone type status hardwareId sensorStatus lastSensorUpdate sensorValue')
      .lean();

    const sensors = spots.map((spot) => ({
      spotId: spot._id,
      code: spot.code,
      zone: spot.zone,
      type: spot.type,
      status: spot.status,
      hardwareId: spot.hardwareId,
      sensorStatus: spot.sensorStatus,
      lastSensorUpdate: spot.lastSensorUpdate,
      sensorValue: spot.sensorValue,
      isConnected: spot.sensorStatus === 'online',
    }));

    res.json({ success: true, data: sensors });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/hardware/sensors/:id ────────────────────────────────────
const getSensorById = async (req, res, next) => {
  try {
    const spot = await ParkingSpot.findById(req.params.id)
      .select('code zone type status hardwareId sensorStatus lastSensorUpdate sensorValue')
      .lean();

    if (!spot) {
      return res.status(404).json({ success: false, message: 'Sensor not found' });
    }

    res.json({
      success: true,
      data: {
        spotId: spot._id,
        code: spot.code,
        zone: spot.zone,
        type: spot.type,
        status: spot.status,
        hardwareId: spot.hardwareId,
        sensorStatus: spot.sensorStatus,
        lastSensorUpdate: spot.lastSensorUpdate,
        sensorValue: spot.sensorValue,
        isConnected: spot.sensorStatus === 'online',
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/hardware/status ─────────────────────────────────────────
const getHardwareStatus = async (req, res, next) => {
  try {
    const mqttStatus = getMQTTStatus();
    const totalSpots = await ParkingSpot.countDocuments();
    const onlineSensors = await ParkingSpot.countDocuments({ sensorStatus: 'online' });
    const offlineSensors = await ParkingSpot.countDocuments({ sensorStatus: 'offline' });

    res.json({
      success: true,
      data: {
        mqtt: mqttStatus,
        sensors: {
          total: totalSpots,
          online: onlineSensors,
          offline: offlineSensors,
          unknown: totalSpots - onlineSensors - offlineSensors,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/hardware/barriers ───────────────────────────────────────
const getBarriers = async (req, res, next) => {
  try {
    const barriers = getAllBarriers();
    res.json({ success: true, data: barriers });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/hardware/barriers/:id/open ─────────────────────────────
const openBarrierController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'manual', simulated = false } = req.body;

    let result;
    if (simulated) {
      result = simulateBarrierAction(id, 'open');
    } else {
      result = await openBarrier(id, reason);
    }

    // Emit WebSocket update
    const status = getBarrierStatus(id);
    emitBarrierStatus(status);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/hardware/barriers/:id/close ────────────────────────────
const closeBarrierController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { simulated = false } = req.body;

    let result;
    if (simulated) {
      result = simulateBarrierAction(id, 'close');
    } else {
      result = await closeBarrier(id, 'manual');
    }

    // Emit WebSocket update
    const status = getBarrierStatus(id);
    emitBarrierStatus(status);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/hardware/barriers/:id/override ─────────────────────────
const overrideBarrier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['open', 'close'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be open or close' });
    }

    let result;
    if (action === 'open') {
      result = await openBarrier(id, 'admin-override');
    } else {
      result = await closeBarrier(id, 'admin-override');
    }

    const status = getBarrierStatus(id);
    emitBarrierStatus(status);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ── Camera endpoints ────────────────────────────────────────────────

// POST /api/hardware/camera/capture
const captureCamera = async (req, res, next) => {
  try {
    const { cameraIndex = 0, returnImage = false } = req.body;
    const result = await capturePlate(cameraIndex, returnImage);
    
    // Emit WebSocket update
    if (result.success) {
      emitCameraResult({
        plate: result.plate,
        confidence: result.confidence,
        timestamp: new Date(),
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/hardware/camera/entry
const processCameraEntryController = async (req, res, next) => {
  try {
    const { barrierId } = req.body;
    const result = await processCameraEntry(barrierId);

    // If successful, open barrier
    if (result.success) {
      try {
        await openBarrier(barrierId, 'camera-plate-match');
        const status = getBarrierStatus(barrierId);
        emitBarrierStatus(status);
      } catch (barrierErr) {
        console.error('[camera] Failed to open barrier:', barrierErr.message);
      }
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/hardware/camera/health
const getCameraHealth = async (req, res, next) => {
  try {
    const health = await checkCameraHealth();
    res.json({ success: true, data: health });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSensors,
  getSensorById,
  getHardwareStatus,
  getBarriers,
  openBarrier: openBarrierController,
  closeBarrier: closeBarrierController,
  overrideBarrier,
  captureCamera,
  processCameraEntry: processCameraEntryController,
  getCameraHealth,
};
