const cron = require('node-cron');
const anomalyService = require('../services/anomalyService');

/**
 * Anomaly Check Job — Módulo 3: Analítica Predictiva (Flux AI v2.0)
 * Ejecuta detección de anomalías cada 15 minutos
 */

function startAnomalyCheckJob() {
  console.log('🔍 Anomaly check job scheduled (every 15 minutes)');

  // Ejecutar cada 15 minutos
  cron.schedule('*/15 * * * *', async () => {
    try {
      await anomalyService.runAnomalyDetection();
    } catch (err) {
      console.error('❌ Anomaly detection job failed:', err.message);
    }
  });

  // Ejecutar inmediatamente al iniciar
  anomalyService.runAnomalyDetection().catch(err => {
    console.error('❌ Initial anomaly detection failed:', err.message);
  });
}

module.exports = { startAnomalyCheckJob };
