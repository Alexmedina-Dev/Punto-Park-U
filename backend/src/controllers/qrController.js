const Reservation = require('../models/Reservation');
const Ticket = require('../models/Ticket');
const ParkingSpot = require('../models/ParkingSpot');
const Tariff = require('../models/Tariff');
const Payment = require('../models/Payment');
const ActivityLog = require('../models/ActivityLog');
const qrService = require('../services/qrService');
const { emitSpotUpdate, emitNewActivity, getIO, ROOMS } = require('../services/socketService');
const { notifyUser } = require('../services/notificationService');

// ── Helpers ────────────────────────────────────────────────────────────

const logActivity = async (userId, action, type, details = {}) => {
  try {
    await ActivityLog.create({ user: userId, action, type, details });
  } catch (err) {
    console.error('[activity] Failed to log activity:', err.message);
  }
};

// ── POST /api/qr/generate ──────────────────────────────────────────────

/**
 * Generate a QR code for an existing reservation.
 * Creates a Ticket document and returns the base64 QR image.
 * Body: { reservationId }
 */
const generateQR = async (req, res, next) => {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({ error: 'reservationId is required' });
    }

    // Fetch reservation with vehicle populated
    const reservation = await Reservation.findById(reservationId)
      .populate('vehicle', 'plate type')
      .populate('spot', 'code zone type');

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Check ownership (admin/operator can generate for any, users only for their own)
    if (req.user.role !== 'admin' && req.user.role !== 'operator') {
      if (reservation.user.toString() !== req.user.id) {
        return res.status(403).json({ error: 'You can only generate QR codes for your own reservations' });
      }
    }

    // Build QR payload
    const payload = qrService.buildQRPayload(reservation);
    const qrContent = JSON.stringify(payload);
    const dataUrl = await qrService.generateQRCode(reservation);

    // Upsert Ticket for this reservation
    await Ticket.findOneAndUpdate(
      { reservation: reservation._id },
      {
        reservation: reservation._id,
        qrData: qrContent,
        qrHash: payload.hmac,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        qrCode: dataUrl,
        reservationId: reservation._id,
        plate: payload.plate,
        expiresAt: payload.timestamp,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/qr/validate ──────────────────────────────────────────────

/**
 * Validate a scanned QR code content (entry validation).
 * Body: { qrContent }
 * Flow: decode HMAC → validate signature → check reservation → update spot → emit WS
 */
const validateEntry = async (req, res, next) => {
  try {
    const { qrContent } = req.body;

    if (!qrContent) {
      return res.status(400).json({ error: 'qrContent is required' });
    }

    // Decode and validate QR
    const validation = qrService.validateQRContent(qrContent);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { reservationId, plate } = validation.payload;

    // Fetch reservation
    const reservation = await Reservation.findById(reservationId)
      .populate('vehicle', 'plate type')
      .populate('spot', 'code zone type');

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Check reservation status
    if (reservation.status === 'completed' || reservation.status === 'cancelled') {
      return res.status(400).json({
        error: `Cannot enter: reservation is ${reservation.status}`,
      });
    }

    if (reservation.status === 'active') {
      return res.status(409).json({
        error: 'Vehicle already entered — reservation is already active',
      });
    }

    // Verify plate matches
    const vehiclePlate = (reservation.vehicle && reservation.vehicle.plate) || '';
    if (vehiclePlate.toUpperCase() !== plate.toUpperCase()) {
      return res.status(400).json({
        error: `Plate mismatch: QR says "${plate}", reservation has "${vehiclePlate}"`,
      });
    }

    // Update reservation to active and set entryTime
    reservation.status = 'active';
    reservation.entryTime = new Date();
    await reservation.save();

    // Update ticket entry validation
    await Ticket.findOneAndUpdate(
      { reservation: reservation._id },
      {
        validatedEntry: true,
        entryValidatedAt: new Date(),
      }
    );

    // Update parking spot to occupied
    if (reservation.spot) {
      const spot = await ParkingSpot.findByIdAndUpdate(
        reservation.spot._id || reservation.spot,
        { status: 'occupied' },
        { new: true }
      );

      if (spot) {
        // Emit WebSocket event for real-time UI update
        emitSpotUpdate({
          id: spot._id.toString(),
          zone: spot.zone,
          status: 'occupied',
          vehicleType: reservation.vehicle?.type || 'car',
          plate: vehiclePlate,
        });
      }
    }

    // Log activity
    logActivity(req.user?.id || 'system', 'Vehicle entry via QR', 'entry', {
      reservationId: reservation._id,
      plate: vehiclePlate,
      spot: reservation.spot?.code || 'N/A',
    });

    // Emit activity event
    emitNewActivity({
      action: 'QR Entry',
      description: `Vehicle ${vehiclePlate} entered via QR scan`,
      type: 'entry',
      user: req.user?.id || 'system',
      timestamp: new Date().toISOString(),
    });

    // Send entry push notification to user
    if (reservation.user) {
      try {
        await notifyUser({
          userId: reservation.user.toString(),
          type: 'entry_alert',
          data: { plate: vehiclePlate, reservationId: reservation._id.toString(), spot: reservation.spot?.code || '' },
        });
      } catch (notifErr) {
        console.warn('[qr:entry] Failed to send entry notification:', notifErr.message);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Entry validated successfully',
        reservationId: reservation._id,
        plate: vehiclePlate,
        spot: reservation.spot?.code || null,
        entryTime: reservation.entryTime,
        status: reservation.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/qr/exit ──────────────────────────────────────────────────

/**
 * Process an exit via QR code scan.
 * Body: { qrContent }
 * Flow: validate QR → calculate duration → generate billing → update spot → emit WS
 */
const processExit = async (req, res, next) => {
  try {
    const { qrContent } = req.body;

    if (!qrContent) {
      return res.status(400).json({ error: 'qrContent is required' });
    }

    // Decode and validate QR
    const validation = qrService.validateQRContent(qrContent);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { reservationId } = validation.payload;

    // Fetch reservation with populated data
    const reservation = await Reservation.findById(reservationId)
      .populate('vehicle', 'plate type')
      .populate('spot', 'code zone type');

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Check reservation status
    if (reservation.status === 'completed') {
      return res.status(400).json({ error: 'Vehicle already exited' });
    }

    if (reservation.status !== 'active') {
      return res.status(400).json({
        error: `Cannot exit: reservation is ${reservation.status}. Vehicle must be active to exit.`,
      });
    }

    if (!reservation.entryTime) {
      return res.status(400).json({ error: 'Entry time not recorded — cannot calculate billing' });
    }

    // Calculate billing
    const vehicleType = (reservation.vehicle && reservation.vehicle.type) || 'car';
    const tariff = await Tariff.findOne({ vehicleType });

    if (!tariff) {
      return res.status(500).json({ error: `No tariff configured for vehicle type: ${vehicleType}` });
    }

    const exitTime = new Date();
    const billingAmount = qrService.calculateBilling(
      new Date(reservation.entryTime),
      exitTime,
      tariff.hourlyRate
    );

    // Update reservation
    reservation.status = 'completed';
    reservation.exitTime = exitTime;
    reservation.billingAmount = billingAmount;
    await reservation.save();

    // Auto-create Payment record
    const payment = await Payment.create({
      user: reservation.user,
      vehicle: (reservation.vehicle && reservation.vehicle._id) || reservation.vehicle,
      reservation: reservation._id,
      amount: billingAmount,
      method: 'pending',
      status: 'pending',
    });

    reservation.payment = payment._id;
    await reservation.save();

    // Emit payment:created WebSocket event
    try {
      const io = getIO();
      io.to(ROOMS.user(reservation.user.toString())).emit('payment:created', {
        paymentId: payment._id,
        reservationId: reservation._id,
        amount: billingAmount,
        status: 'pending',
        method: 'pending',
      });
    } catch (wsErr) {
      console.warn('[qr:exit] Failed to emit payment:created:', wsErr.message);
    }

    // Update ticket exit validation
    await Ticket.findOneAndUpdate(
      { reservation: reservation._id },
      {
        validatedExit: true,
        exitValidatedAt: new Date(),
      }
    );

    // Free the parking spot
    if (reservation.spot) {
      const spot = await ParkingSpot.findByIdAndUpdate(
        reservation.spot._id || reservation.spot,
        { status: 'available' },
        { new: true }
      );

      if (spot) {
        // Emit WebSocket event
        emitSpotUpdate({
          id: spot._id.toString(),
          zone: spot.zone,
          status: 'available',
          vehicleType: reservation.vehicle?.type || 'car',
          plate: '',
        });
      }
    }

    const vehiclePlate = (reservation.vehicle && reservation.vehicle.plate) || 'N/A';

    // Log activity
    logActivity(req.user?.id || 'system', 'Vehicle exit via QR', 'exit', {
      reservationId: reservation._id,
      plate: vehiclePlate,
      billingAmount,
      duration: exitTime.toISOString(),
    });

    // Emit activity event
    emitNewActivity({
      action: 'QR Exit',
      description: `Vehicle ${vehiclePlate} exited — billed $${billingAmount.toLocaleString()}`,
      type: 'exit',
      user: req.user?.id || 'system',
      timestamp: new Date().toISOString(),
    });

    // Send exit push notification to user
    if (reservation.user) {
      try {
        await notifyUser({
          userId: reservation.user.toString(),
          type: 'exit_alert',
          data: {
            plate: vehiclePlate,
            reservationId: reservation._id.toString(),
            billingAmount,
            duration: durationFormatted,
          },
        });
      } catch (notifErr) {
        console.warn('[qr:exit] Failed to send exit notification:', notifErr.message);
      }
    }

    // Format duration for response
    const durationMs = exitTime.getTime() - new Date(reservation.entryTime).getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const durationFormatted = `${hours}h ${minutes}m`;

    res.status(200).json({
      success: true,
      data: {
        message: 'Exit processed successfully',
        reservationId: reservation._id,
        plate: vehiclePlate,
        spot: reservation.spot?.code || null,
        entryTime: reservation.entryTime,
        exitTime,
        duration: durationFormatted,
        durationMinutes,
        billingAmount,
        paymentId: payment._id,
        status: reservation.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/qr/ticket/:reservationId ──────────────────────────────────

/**
 * Get the QR code for a reservation (returns stored QR data URL).
 */
const getQRCode = async (req, res, next) => {
  try {
    const { reservationId } = req.params;

    const ticket = await Ticket.findOne({ reservation: reservationId })
      .populate({
        path: 'reservation',
        populate: { path: 'vehicle', select: 'plate type' },
      });

    if (!ticket) {
      return res.status(404).json({ error: 'No QR code found for this reservation. Generate one first.' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && req.user.role !== 'operator') {
      if (ticket.reservation.user.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Regenerate QR data URL from stored qrData
    const QRCode = require('qrcode');
    const dataUrl = await QRCode.toDataURL(ticket.qrData, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });

    res.status(200).json({
      success: true,
      data: {
        qrCode: dataUrl,
        reservationId,
        plate: ticket.reservation?.vehicle?.plate || 'N/A',
        validatedEntry: ticket.validatedEntry,
        validatedExit: ticket.validatedExit,
        createdAt: ticket.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateQR,
  validateEntry,
  processExit,
  getQRCode,
};
