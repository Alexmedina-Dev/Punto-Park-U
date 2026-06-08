const mqtt = require('mqtt');
const config = require('../config');
const ParkingSpot = require('../models/ParkingSpot');
const { emitSpotUpdate } = require('./socketService');

/**
 * MQTT Service — Hardware Integration Phase 7
 * Subscribes to sensor topics, updates MongoDB, emits WebSocket events
 */

let client = null;
let isConnected = false;

const TOPIC_PREFIX = config.mqttTopicPrefix || 'parking/spots';
const OCCUPANCY_TOPIC = `${TOPIC_PREFIX}/+/occupancy`;

// ── Connect to MQTT Broker ──────────────────────────────────────────

function connectMQTT() {
  const brokerUrl = config.mqttBrokerUrl || 'mqtt://localhost:1883';

  console.log(`[mqtt] Connecting to ${brokerUrl}...`);

  client = mqtt.connect(brokerUrl, {
    clientId: `punto-park-u-backend-${Date.now()}`,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    clean: true,
  });

  client.on('connect', () => {
    isConnected = true;
    console.log(`[mqtt] Connected to broker`);
    client.subscribe(OCCUPANCY_TOPIC, (err) => {
      if (err) {
        console.error('[mqtt] Subscription error:', err.message);
      } else {
        console.log(`[mqtt] Subscribed to ${OCCUPANCY_TOPIC}`);
      }
    });
  });

  client.on('message', handleSensorMessage);

  client.on('error', (err) => {
    console.error('[mqtt] Error:', err.message);
    isConnected = false;
  });

  client.on('close', () => {
    console.log('[mqtt] Connection closed');
    isConnected = false;
  });

  client.on('reconnect', () => {
    console.log('[mqtt] Reconnecting...');
  });
}

// ── Handle Incoming Sensor Messages ─────────────────────────────────

async function handleSensorMessage(topic, message) {
  try {
    const payload = JSON.parse(message.toString());
    const spotId = extractSpotId(topic);

    if (!spotId) {
      console.warn('[mqtt] Could not extract spotId from topic:', topic);
      return;
    }

    const { occupied, distance, timestamp } = payload;

    // Update ParkingSpot in MongoDB
    const spot = await ParkingSpot.findOneAndUpdate(
      { $or: [{ _id: spotId }, { hardwareId: spotId }] },
      {
        status: occupied ? 'occupied' : 'available',
        sensorStatus: 'online',
        lastSensorUpdate: timestamp ? new Date(timestamp) : new Date(),
        sensorValue: distance || null,
      },
      { new: true }
    );

    if (spot) {
      // Emit real-time update via WebSocket
      emitSpotUpdate({
        id: spot._id.toString(),
        zone: spot.zone,
        status: spot.status,
        hardwareId: spot.hardwareId,
        sensorStatus: spot.sensorStatus,
        lastSensorUpdate: spot.lastSensorUpdate,
        sensorValue: spot.sensorValue,
      });

      console.log(`[mqtt] Spot ${spot.code} updated: ${spot.status} (distance: ${distance}cm)`);
    } else {
      console.warn('[mqtt] No spot found for:', spotId);
    }
  } catch (err) {
    console.error('[mqtt] Message handling error:', err.message);
  }
}

// ── Extract Spot ID from Topic ──────────────────────────────────────

function extractSpotId(topic) {
  // Topic format: parking/spots/{spotId}/occupancy
  const parts = topic.split('/');
  if (parts.length >= 3) {
    return parts[2];
  }
  return null;
}

// ── Publish Command to Sensor ───────────────────────────────────────

function publishSensorCommand(spotId, command) {
  if (!client || !isConnected) {
    console.warn('[mqtt] Not connected, cannot publish');
    return false;
  }
  const topic = `${TOPIC_PREFIX}/${spotId}/command`;
  client.publish(topic, JSON.stringify(command));
  return true;
}

// ── Graceful Disconnect ─────────────────────────────────────────────

function disconnectMQTT() {
  if (client) {
    client.end(true);
    client = null;
    isConnected = false;
    console.log('[mqtt] Disconnected');
  }
}

// ── Get Connection Status ───────────────────────────────────────────

function getMQTTStatus() {
  return {
    connected: isConnected,
    broker: config.mqttBrokerUrl || 'mqtt://localhost:1883',
    subscribedTopic: OCCUPANCY_TOPIC,
  };
}

module.exports = {
  connectMQTT,
  disconnectMQTT,
  publishSensorCommand,
  getMQTTStatus,
};
