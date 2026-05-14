/**
 * fingerprint.js — Servicio de fingerprinting de dispositivos.
 *
 * Genera un visitorId único usando @fingerprintjs/fingerprintjs (open source).
 * El resultado se cachea en memoria para no recalcular en cada llamada.
 */
import FingerprintJS from '@fingerprintjs/fingerprintjs';

let cachedVisitorId = null;
let fpPromise = null;

/**
 * Obtiene el visitorId del dispositivo actual.
 * Se cachea en memoria tras la primera llamada.
 * @returns {Promise<string>} visitorId único del dispositivo
 */
export async function getVisitorId() {
  if (cachedVisitorId) return cachedVisitorId;

  try {
    if (!fpPromise) {
      fpPromise = FingerprintJS.load();
    }
    const fp = await fpPromise;
    const result = await fp.get();
    cachedVisitorId = result.visitorId;
    return cachedVisitorId;
  } catch (err) {
    console.error('fingerprint: Error obteniendo visitorId:', err);
    // Fallback: generar un ID basado en User-Agent + screen
    const fallback = btoa(
      `${navigator.userAgent}|${screen.width}x${screen.height}|${navigator.language}`
    ).slice(0, 32);
    cachedVisitorId = `fallback-${fallback}`;
    return cachedVisitorId;
  }
}
