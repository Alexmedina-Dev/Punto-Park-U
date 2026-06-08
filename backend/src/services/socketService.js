const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config');

// ── Singleton ─────────────────────────────────────────────────────────

let io = null;

// ── Rooms ─────────────────────────────────────────────────────────────

const ROOMS = {
  PARKING_SPOTS: 'parking:spots',
  ACTIVITY: 'activity',
  ADMIN_ALERTS: 'admin:alerts',
  user: (userId) => `user:${userId}`,
};

// ── Auth middleware ───────────────────────────────────────────────────
// Authenticate via 'auth' event payload, NOT query params.
// The client sends { token } on the 'auth' event after connecting.

const handleAuth = (socket) => {
  return (payload, callback) => {
    try {
      if (!payload || !payload.token) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Token required' });
        }
        return;
      }

      const decoded = jwt.verify(payload.token, config.jwtSecret);
      socket.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      // ── Join rooms based on role ────────────────────────────
      // All authenticated users join parking spot and activity rooms
      socket.join(ROOMS.PARKING_SPOTS);
      socket.join(ROOMS.ACTIVITY);

      // Admin users join admin alerts room
      if (decoded.role === 'admin') {
        socket.join(ROOMS.ADMIN_ALERTS);
      }

      // Every user joins their personal room
      socket.join(ROOMS.user(decoded.id));

      if (typeof callback === 'function') {
        callback({ success: true, user: { id: decoded.id, role: decoded.role } });
      }
    } catch (err) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Invalid token' });
      }
    }
  };
};

// ── Initialize ────────────────────────────────────────────────────────

const initSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Enable HTTP long-polling as fallback
    transports: ['websocket', 'polling'],
  });

  // ── Connection handler ─────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`[socket] Client connected: ${socket.id}`);

    // Require auth via 'auth' event
    socket.on('auth', handleAuth(socket));

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[socket] Client disconnected: ${socket.id} (${reason})`);
    });

    // Handle errors
    socket.on('error', (err) => {
      console.error(`[socket] Error on ${socket.id}:`, err.message);
    });
  });

  console.log('[socket] Socket.IO initialized');
  return io;
};

// ── Get IO instance ───────────────────────────────────────────────────

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocketIO first.');
  }
  return io;
};

// ── Emit helpers ──────────────────────────────────────────────────────

/**
 * Emit a parking spot update to all users in the parking:spots room.
 * @param {Object} spot - { id, zone, status, vehicleType?, plate? }
 */
const emitSpotUpdate = (spot) => {
  try {
    getIO().to(ROOMS.PARKING_SPOTS).emit('spot:update', spot);
  } catch (err) {
    console.error('[socket] Failed to emit spot:update:', err.message);
  }
};

/**
 * Emit a new alert to admin users in the admin:alerts room.
 * @param {Object} alert - Formatted alert object
 */
const emitNewAlert = (alert) => {
  try {
    getIO().to(ROOMS.ADMIN_ALERTS).emit('alert:new', alert);
  } catch (err) {
    console.error('[socket] Failed to emit alert:new:', err.message);
  }
};

/**
 * Emit a new activity entry to the activity room.
 * @param {Object} activity - Formatted activity log object
 */
const emitNewActivity = (activity) => {
  try {
    getIO().to(ROOMS.ACTIVITY).emit('activity:new', activity);
  } catch (err) {
    console.error('[socket] Failed to emit activity:new:', err.message);
  }
};

/**
 * Emit a barrier status update to the activity room.
 * @param {Object} barrier - { id, name, isOpen, lastActivatedAt, autoCloseIn }
 */
const emitBarrierStatus = (barrier) => {
  try {
    getIO().to(ROOMS.ACTIVITY).emit('barrier:status', barrier);
  } catch (err) {
    console.error('[socket] Failed to emit barrier:status:', err.message);
  }
};

/**
 * Emit a camera result to the activity room.
 * @param {Object} result - { plate, confidence, timestamp }
 */
const emitCameraResult = (result) => {
  try {
    getIO().to(ROOMS.ACTIVITY).emit('camera:result', result);
  } catch (err) {
    console.error('[socket] Failed to emit camera:result:', err.message);
  }
};

module.exports = {
  initSocketIO,
  getIO,
  emitSpotUpdate,
  emitNewAlert,
  emitNewActivity,
  emitBarrierStatus,
  emitCameraResult,
  ROOMS,
};
