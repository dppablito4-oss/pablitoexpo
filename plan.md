# Pablito Expo: Master Implementation Plan (v1.0)

Este documento detalla la hoja de ruta técnica para la optimización responsiva, seguridad de identidad y el motor de personalidad de IA de Pablito Expo.

## 1. Arquitectura de UI Responsiva (Editor.jsx)

El objetivo es pasar de un diseño rígido de escritorio a uno híbrido adaptativo.

**📱 Comportamiento por Dispositivo**

* **Móvil Vertical (Portrait):**
  * Canvas: Ocupa el 100% del área central visible.
  * Paneles (Secciones/Opciones): Implementados como Drawers laterales (posicionamiento fixed) que se deslizan sobre el Canvas.
  * Navegación: Header móvil con botones para invocar los paneles.

* **Móvil/Tablet Horizontal (Landscape):**
  * Layout: Split-screen automático (flex-row).
  * Persistencia: Panel de Secciones (Izquierda) se vuelve estático. El Canvas ocupa 2/3 y el Panel de Opciones (Derecha) ocupa 1/3.

* **Desktop:**
  * Diseño clásico de 3 columnas fijas con anchos optimizados (w-72 / flex-1 / w-80).

## 2. Seguridad & Blindaje de Identidad (Anti-Fraud System)

Para proteger los créditos de GPT-4o mini y evitar el abuso de cuentas.

**🛡️ Fingerprinting de Hardware (Simulado)**

* **Librería:** `@fingerprintjs/fingerprintjs`.
* **Lógica de "Amarre":**
  * Se genera un `visitorId` único basado en entropía de hardware (Canvas, AudioContext, Fuentes).
  * Regla de Oro: Máximo 2 correos electrónicos verificados por `visitorId`.
  * Persistencia: Almacenar el vínculo email <-> `visitorId` en la tabla `device_trust` de Supabase.

**📲 Validación QR (PC Compartida / Universidad)**

* **Problema:** PCs de la UNHEVAL con el mismo fingerprint ya "quemado".
* **Solución:**
  1. Si el `visitorId` de la PC ya tiene 2 cuentas, se dispara un reto QR.
  2. El usuario escanea el QR con su móvil personal.
  3. El móvil (con un visitorId limpio) valida la sesión en la PC mediante un canal de Supabase Realtime.

## 3. Motor de Personalidad IA (P.A.B.L.O.)

Configuración de los modos de asistencia para el modelo GPT-4o mini.

**🎭 System Prompts Estratégicos**

* **El Brayan (High Intensity):** > "Actúa como un joven de barrio de Huánuco, Perú. Usa jerga peruana (causa, pichanguita, basura, ya perdiste). Eres agresivo, directo, pero leal. Si el usuario se queja, búrlate con humor pesado."
* **Catedrático (Low Intensity):** > "Actúa como un profesor emérito de la UNHEVAL. Lenguaje técnico, preciso, formal y pedagógico. Cero jergas."
* **El Renegón (Medium Intensity):** > "Eres un desarrollador senior estresado. Te molesta que te pregunten cosas obvias. Responde rápido y con tono de impaciencia."

## 4. Gestión de Datos & Privacidad (EULA Compliance)

Implementación de las políticas de retención para cumplir con los Términos y Condiciones.

**🗑️ Ciclo de Vida del Dato**

* **Sesiones:** Expira el `session_token` tras 20 min de inactividad o cierre de ventana.
* **Conversaciones:** Solo se mantienen los últimos 10 mensajes en el contexto de la API. No se guardan en texto plano en la base de datos persistente del perfil.
* **Papelera de Reciclaje (Soft Delete):**
  * Columna `deleted_at` en la tabla `projects`.
  * Window: 7 días de gracia para restauración manual vía admin.
  * Cron Job: Borrado físico (HARD DELETE) automático tras el día 7.

## 5. Sistema de Notificaciones Corporativas (Spam Control)

Uso de plantillas HTML para comunicaciones oficiales.

**📧 Flujo de Correos**

* **Verificación OTP:** Requerido para desbloquear el uso de la IA (prevención de bots).
* **Alertas de Seguridad:** Notificación inmediata si el `visitorId` cambia drásticamente en un inicio de sesión.
* **Infraestructura sugerida:** Resend o SendGrid para asegurar entregabilidad en Gmail.

## 6. Stack Tecnológico de Referencia

* **Frontend:** React + Tailwind CSS.
* **Backend/DB:** Supabase (Auth, DB, Edge Functions, Realtime).
* **IA Engine:** OpenAI API (GPT-4o mini).
* **Assets:** Unsplash API (Límite 5k req/mes).
* **Iconografía:** Lucide-React.
