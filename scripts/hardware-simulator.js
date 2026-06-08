/**
 * Hardware Simulator — Phase 7 IoT
 * Simulates ESP32 sensors publishing MQTT messages for development/testing
 * without physical hardware.
 *
 * Usage:
 *   node scripts/hardware-simulator.js        # start simulator
 *   node scripts/hardware-simulator.js --stop  # stop simulator
 */

const mqtt = require('mqtt');

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || 'parking/spots';

// Mock spots with hardwareIds
const MOCK_SPOTS = [
  { spotId: 'A1', hardwareId: 'esp32-001', zone: 'A' },
  { spotId: 'A2', hardwareId: 'esp32-002', zone: 'A' },
  { spotId: 'B1', hardwareId: 'esp32-003', zone: 'B' },
  { spotId: 'B2', hardwareId: 'esp32-004', zone: 'B' },
  { spotId: 'C1', hardwareId: 'esp32-005', zone: 'C' },
  { spotId: 'C2', hardwareId: 'esp32-006', zone: 'C' },
];

let client = null;
let intervalId = null;

function getRandomDistance() {
  // Ultrasonic sensor range: 2cm - 400cm
  return Math.floor(Math.random() * 350) + 10;
}

function isOccupied(distance) {
  // Threshold: less than 50cm = occupied
  return distance < 50;
}

function publishSensorData() {
  MOCK_SPOTS.forEach((spot) => {
    const distance = getRandomDistance();
    const occupied = isOccupied(distance);
    const topic = `${TOPIC_PREFIX}/${spot.hardwareId}/occupancy`;
    const payload = JSON.stringify({
      occupied,
      distance,
      timestamp: new Date().toISOString(),
      spotId: spot.spotId,
      hardwareId: spot.hardwareId,
    });

    client.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[simulator] Publish error for ${spot.spotId}:`, err.message);
      } else {
        console.log(`[simulator] ${spot.spotId} (${spot.hardwareId}): ${occupied ? 'OCCUPIED' : 'FREE'} (${distance}cm)`);
      }
    });
  });
}

function startSimulator() {
  console.log(`[simulator] Connecting to ${BROKER_URL}...`);

  client = mqtt.connect(BROKER_URL, {
    clientId: `punto-park-u-simulator-${Date.now()}`,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => {
    console.log('[simulator] Connected to MQTT broker');
    console.log('[simulator] Publishing sensor data every 5 seconds...');
    console.log('[simulator] Press Ctrl+C to stop\n');

    // Publish immediately
    publishSensorData();

    // Publish every 5 seconds
    intervalId = setInterval(publishSensorData, 5000);
  });

  client.on('error', (err) => {
    console.error('[simulator] MQTT error:', err.message);
  });

  client.on('close', () => {
    console.log('[simulator] Connection closed');
  });
}

function stopSimulator() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (client) {
    client.end(true);
    client = null;
  }
  console.log('[simulator] Stopped');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  stopSimulator();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopSimulator();
  process.exit(0);
});

// ── Run ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.includes('--stop')) {
  stopSimulator();
} else {
  startSimulator();
}
