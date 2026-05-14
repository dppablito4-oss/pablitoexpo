/**
 * deviceTrustService.js — Servicio de confianza de dispositivos.
 *
 * Implementa la "Regla de Oro" del plan:
 * Máximo 2 correos electrónicos verificados por visitorId.
 *
 * Flujo:
 * 1. Al hacer login/registro, se obtiene el visitorId del dispositivo.
 * 2. Se consulta device_trust para ver cuántos emails distintos hay con ese visitorId.
 * 3. Si ya hay 2 y el email actual no es uno de ellos → bloquear.
 * 4. Si no, registrar el vínculo email↔visitorId.
 */
import { getVisitorId } from './fingerprint';

const MAX_ACCOUNTS_PER_DEVICE = 2;

/**
 * Verifica si el dispositivo actual puede ser usado por este email.
 * Si pasa la verificación, registra el vínculo en device_trust.
 *
 * @param {object} supabase — cliente Supabase
 * @param {string} userId — UUID del usuario
 * @param {string} email — email del usuario
 * @returns {Promise<{ trusted: boolean, visitorId: string, reason?: string }>}
 */
export async function verifyDeviceTrust(supabase, userId, email) {
  try {
    const visitorId = await getVisitorId();

    // 1. Buscar todos los registros con este visitorId
    const { data: existing, error: fetchErr } = await supabase
      .from('device_trust')
      .select('user_email')
      .eq('visitor_id', visitorId);

    if (fetchErr) {
      console.error('deviceTrust: Error consultando tabla:', fetchErr.message);
      // En caso de error de BD, dejar pasar (fail-open) para no bloquear usuarios legítimos
      return { trusted: true, visitorId, reason: 'Error de BD (fail-open)' };
    }

    // 2. Obtener emails únicos vinculados a este dispositivo
    const linkedEmails = [...new Set((existing || []).map(r => r.user_email))];

    // 3. Si este email ya está vinculado → OK
    if (linkedEmails.includes(email)) {
      // Actualizar last_seen
      await supabase
        .from('device_trust')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('visitor_id', visitorId)
        .eq('user_email', email);

      return { trusted: true, visitorId };
    }

    // 4. Si el dispositivo ya tiene el máximo de emails → BLOQUEAR
    if (linkedEmails.length >= MAX_ACCOUNTS_PER_DEVICE) {
      // Registrar intento en security_logs si la tabla existe
      try {
        await supabase.from('security_logs').insert({
          action: 'DEVICE_LIMIT_EXCEEDED',
          actor_id: userId,
          details: `visitorId=${visitorId}, email=${email}, existingEmails=${linkedEmails.join(',')}`,
        });
      } catch { /* ignore if table doesn't exist */ }

      return {
        trusted: false,
        visitorId,
        reason: `Este dispositivo ya tiene ${MAX_ACCOUNTS_PER_DEVICE} cuentas vinculadas (${linkedEmails.join(', ')}). No puedes usar más cuentas desde aquí.`,
      };
    }

    // 5. Vincular nuevo email al dispositivo
    const { error: insertErr } = await supabase
      .from('device_trust')
      .upsert({
        visitor_id: visitorId,
        user_id: userId,
        user_email: email,
        last_seen_at: new Date().toISOString(),
      }, {
        onConflict: 'visitor_id,user_email',
      });

    if (insertErr) {
      console.error('deviceTrust: Error insertando vínculo:', insertErr.message);
      // Fail-open
      return { trusted: true, visitorId, reason: 'Error al registrar (fail-open)' };
    }

    return { trusted: true, visitorId };

  } catch (err) {
    console.error('deviceTrust: Error inesperado:', err);
    // Fail-open para no romper el flujo de login
    return { trusted: true, visitorId: 'unknown', reason: 'Error inesperado (fail-open)' };
  }
}

/**
 * Obtiene info del dispositivo actual (para mostrar en admin/settings).
 */
export async function getDeviceInfo() {
  try {
    const visitorId = await getVisitorId();
    return {
      visitorId,
      isFallback: visitorId.startsWith('fallback-'),
    };
  } catch {
    return { visitorId: 'unknown', isFallback: true };
  }
}
