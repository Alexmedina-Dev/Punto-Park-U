const axios = require('axios');
const config = require('../config');

/**
 * Barrier Service — Phase 7 Hardware Integration
 * HTTP client for ESP32 relay modules controlling physical barriers
 */

// ── Default Configuration ──────────────────────────────────────────

const DEFAULT_BARRIERS = [
  {
    id: 'entry-main',
    name: 'Barrera Principal - Entrada',
    location: 'Entrada principal',
    endpoint: 'http://192.168.1.100',
    type: 'entry',
  },
  {
    id: 'exit-main',
    name: 'Barrera Principal - Salida',
    location: 'Salida principal',
    endpoint: 'http://192.168.1.101',
    type: 'exit',
  },
];

const AUTO_CLOSE_MS = config.barrierAutoCloseMs || 30000;
const TIMEOUT_MS = config.barrierTimeoutMs || 5000;

// ── State Management ───────────────────────────────────────────────

const barrierStates = new Map();
const autoCloseTimers = new Map();

function initializeBarriers() {
  const barriers = config.barrierEndpoints || DEFAULT_BARRIERS;
  barriers.forEach((barrier) => {
    barrierStates.set(barrier.id, {
      ...barrier,
      isOpen: false,
      lastActivatedAt: null,
      autoCloseTimer: null,
      error: null,
    });
  });
  console.log(`[barrier] Initialized ${barriers.length} barriers`);
  return barriers;
}

// ── HTTP Control ───────────────────────────────────────────────────

async function sendBarrierCommand(barrierId, command) {
  const barrier = barrierStates.get(barrierId);
  if (!barrier) {
    throw new Error(`Barrier ${barrierId} not found`);
  }

  const endpoint = barrier.endpoint;
  const url = `${endpoint}/relay/${command}`;

  try {
    const response = await axios.post(url, {}, { timeout: TIMEOUT_MS });
    return {
      success: true,
      barrierId,
      command,
      response: response.data,
    };
  } catch (err) {
    console.error(`[barrier] HTTP error for ${barrierId}:`, err.message);
    throw new Error(`Failed to ${command} barrier ${barrierId}: ${err.message}`);
  }
}

// ── Open Barrier ────────────────────────────────────────────────────

async function openBarrier(barrierId, reason = 'manual') {
  const result = await sendBarrierCommand(barrierId, 'on');

  // Update state
  const state = barrierStates.get(barrierId);
  state.isOpen = true;
  state.lastActivatedAt = new Date();
  state.error = null;

  // Cancel existing auto-close timer
  if (autoCloseTimers.has(barrierId)) {
    clearTimeout(autoCloseTimers.get(barrierId));
    autoCloseTimers.delete(barrierId);
  }

  // Set auto-close timer
  const timer = setTimeout(() => {
    console.log(`[barrier] Auto-closing ${barrierId} after ${AUTO_CLOSE_MS}ms`);
    closeBarrier(barrierId, 'auto-close').catch((err) => {
      console.error(`[barrier] Auto-close failed for ${barrierId}:`, err.message);
    });
  }, AUTO_CLOSE_MS);

  autoCloseTimers.set(barrierId, timer);

  console.log(`[barrier] ${barrierId} opened (${reason})`);
  return result;
}

// ── Close Barrier ──────────────────────────────────────────────────

async function closeBarrier(barrierId, reason = 'manual') {
  const result = await sendBarrierCommand(barrierId, 'off');

  // Update state
  const state = barrierStates.get(barrierId);
  state.isOpen = false;
  state.error = null;

  // Cancel auto-close timer
  if (autoCloseTimers.has(barrierId)) {
    clearTimeout(autoCloseTimers.get(barrierId));
    autoCloseTimers.delete(barrierId);
  }

  console.log(`[barrier] ${barrierId} closed (${reason})`);
  return result;
}

// ── Get Barrier Status ──────────────────────────────────────────────

function getBarrierStatus(barrierId) {
  const state = barrierStates.get(barrierId);
  if (!state) return null;

  return {
    id: state.id,
    name: state.name,
    location: state.location,
    type: state.type,
    isOpen: state.isOpen,
    lastActivatedAt: state.lastActivatedAt,
    autoCloseIn: autoCloseTimers.has(barrierId) ? AUTO_CLOSE_MS : null,
    error: state.error,
  };
}

// ── Get All Barriers ───────────────────────────────────────────────

function getAllBarriers() {
  return Array.from(barrierStates.keys()).map((id) => getBarrierStatus(id));
}

// ── Health Check ───────────────────────────────────────────────────

async function healthCheck(barrierId) {
  const barrier = barrierStates.get(barrierId);
  if (!barrier) {
    return { healthy: false, error: 'Barrier not found' };
  }

  try {
    const response = await axios.get(`${barrier.endpoint}/health`, { timeout: 3000 });
    return {
      healthy: response.status === 200,
      barrierId,
      response: response.data,
    };
  } catch (err) {
    return {
      healthy: false,
      barrierId,
      error: err.message,
    };
  }
}

// ── Cancel Auto-Close ────────────────────────────────────────────────

function cancelAutoClose(barrierId) {
  if (autoCloseTimers.has(barrierId)) {
    clearTimeout(autoCloseTimers.get(barrierId));
    autoCloseTimers.delete(barrierId);
    console.log(`[barrier] Auto-close cancelled for ${barrierId}`);
    return true;
  }
  return false;
}

// ── Simulate Barrier (for dev without hardware) ────────────────────

function simulateBarrierAction(barrierId, action) {
  const state = barrierStates.get(barrierId);
  if (!state) {
    throw new Error(`Barrier ${barrierId} not found`);
  }

  if (action === 'open') {
    state.isOpen = true;
    state.lastActivatedAt = new Date();
    
    // Auto-close timer
    const timer = setTimeout(() => {
      state.isOpen = false;
      console.log(`[barrier] Simulated auto-close for ${barrierId}`);
    }, AUTO_CLOSE_MS);
    autoCloseTimers.set(barrierId, timer);
    
    return { success: true, simulated: true, barrierId, action };
  } else if (action === 'close') {
    state.isOpen = false;
    if (autoCloseTimers.has(barrierId)) {
      clearTimeout(autoCloseTimers.get(barrierId));
      autoCloseTimers.delete(barrierId);
    }
    return { success: true, simulated: true, barrierId, action };
  }

  throw new Error(`Invalid action: ${action}`);
}

// ── Initialize on module load ────────────────────────────────────

const initializedBarriers = initializeBarriers();

module.exports = {
  openBarrier,
  closeBarrier,
  getBarrierStatus,
  getAllBarriers,
  healthCheck,
  cancelAutoClose,
  simulateBarrierAction,
  initializedBarriers,
  AUTO_CLOSE_MS,
};
