import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  {
    title: 'Términos y Condiciones de Uso',
    icon: '📜',
    accent: '#00f0ff',
    content: [
      {
        heading: '1. Aceptación del Servicio',
        text: `Bienvenido a Pablito Expo, plataforma de edición y despliegue de presentaciones web interactivas, desarrollada por Samuel Y. Pablo Claudio (pablitodp). Al registrarte y utilizar nuestras herramientas, aceptas cumplir con las reglas aquí descritas. Este es un entorno educativo y tecnológico en fase de desarrollo activo, diseñado para potenciar la creación de contenido visual dinámico mediante bloques inteligentes, recursos gráficos avanzados y asistencia de Inteligencia Artificial.`,
      },
      {
        heading: '2. Cuentas, Verificación y Seguridad',
        items: [
          { label: 'Registro y OTP', text: 'Para acceder a funciones avanzadas (IA, bloques complejos, sistema de rangos), es obligatorio verificar la cuenta mediante un código OTP de un solo uso enviado a tu correo electrónico. Este mecanismo garantiza la integridad del sistema y previene el abuso de créditos computacionales.' },
          { label: 'Rate Limiting y Anti-Spam', text: 'Para garantizar la estabilidad del servidor, se aplican políticas de limitación de velocidad (Rate Limiting). El sistema bloqueará temporalmente las solicitudes de OTP si detecta un comportamiento repetitivo o sospechoso. El intervalo mínimo entre solicitudes de código es de 60 segundos.' },
          { label: 'Límite de Caracteres por Mensaje', text: 'El sistema limita los mensajes enviados a la IA a un máximo de 500 caracteres por consulta del usuario. Esta medida previene el "Bombeo de Tokens", que elevaría los costos operativos y perjudicaría la disponibilidad del servicio para toda la comunidad.' },
          { label: 'Identidad Única', text: 'El sistema utiliza identificadores técnicos anónimos del dispositivo para prevenir fraude, ataques de bots y asegurar la integridad del sistema de puntos. Este identificador no identifica a la persona, sino que vincula la actividad al equipo para evitar el abuso de créditos gratuitos. El usuario puede solicitar la eliminación de estos datos contactando al administrador.' },
          { label: 'Responsabilidad de Credenciales', text: 'El usuario es responsable de la custodia de sus credenciales de acceso. No compartas tu cuenta con terceros. Las contraseñas están cifradas y no son accesibles por el administrador del sistema.' },
        ],
      },
      {
        heading: '3. El Asistente P.A.B.L.O. — Arquitectura Híbrida de IA',
        text: 'El asistente P.A.B.L.O. (Planificación Avanzada de Bloques, Layouts y Operaciones) opera mediante una arquitectura de procesamiento distribuido que selecciona el motor de IA según el perfil de personalidad elegido por el usuario:',
        items: [
          { label: 'Perfiles de Entretenimiento (El Brayan / El Renegón)', text: 'Procesados mediante la tecnología DeepSeek V3. Estos modelos están diseñados para emplear un lenguaje informal, altamente sarcástico y coloquial (jerga urbana peruana), con fines de parodia y entretenimiento. Al activar estos modos, el usuario acepta interactuar con una simulación de carácter satírico.' },
          { label: 'Perfiles Académicos y Asistenciales (Catedrático, Científico)', text: 'Procesados mediante tecnología DeepSeek V3, enfocados en la precisión técnica, terminología académica y formalidad lingüística.' },
          { label: 'Perfil de Motivación (Motivador)', text: 'Procesado mediante tecnología DeepSeek V3, optimizado para respuestas emocionales cortas y positivas.' },
        ],
      },
      {
        heading: '3.1. Exención de Responsabilidad por Tono y Contenido Generado',
        text: 'Los modos de entretenimiento (El Brayan, El Renegón, La Tóxica, La Pituca) utilizan lenguaje de barrio, sarcasmo e ironía urbana. Estos personajes son simulaciones algorítmicas de parodia cultural y no reflejan la opinión personal del desarrollador ni buscan promover discriminación real. Al activar dichos modos, el usuario acepta interactuar con un personaje satírico de ficción y libera a Samuel Y. Pablo Claudio (pablitodp) de cualquier responsabilidad por el tono de las respuestas generadas.\n\nDescargo de Responsabilidad: Los nombres y personalidades de Yajhaira y Valerie son creaciones estrictamente ficticias con fines recreativos e interactivos; cualquier coincidencia con personas reales, nombres o situaciones de la vida real es pura casualidad y no representa ni alude a ningún individuo en particular.\n\nAdemás, el sistema de IA puede cometer errores, producir "alucinaciones" o respuestas imprecisas. La plataforma no garantiza la exactitud de las respuestas generadas por ninguna de las personalidades.',
      },
      {
        heading: '3.2. Contexto de Conversación y Privacidad de Chats',
        items: [
          { label: 'Ventana de Contexto', text: 'Para mantener el hilo de la conversación, el sistema envía al motor de IA únicamente los últimos 10 mensajes del chat activo. No se almacena historial permanente de conversaciones en el servidor.' },
          { label: 'Almacenamiento Local de Chats', text: 'El historial de conversaciones (hasta 5 sesiones de chat, con un máximo de 10 mensajes cada una) se guarda exclusivamente en el almacenamiento local (localStorage) de tu navegador, vinculado a tu identificador de usuario. La plataforma no interfiere con estos datos locales.' },
          { label: 'Control Total', text: 'El usuario puede eliminar manualmente cualquiera de sus conversaciones desde el panel del asistente en cualquier momento.' },
        ],
      },
      {
        heading: '3.3. Créditos de IA y Sostenibilidad del Proyecto',
        items: [
          { label: 'Créditos No Ilimitados', text: 'Debido a los costos operativos reales de las APIs de DeepSeek, los créditos de IA no son ilimitados. El consumo dependerá del nivel de verbosidad seleccionado: Corta, Media o Larga.' },
          { label: 'Recargas', text: 'Las recargas de créditos se gestionan de forma directa (transferencia bancaria, Yape/Plin o efectivo). Cualquier apoyo económico es recibido como contribución al proyecto y puede otorgar beneficios exclusivos, como una mayor cuota de tokens disponibles.' },
          { label: 'No Reembolsos', text: 'Una vez asignados los créditos, no existen reembolsos, salvo error verificable del sistema (ej: se descontaron créditos pero la IA no generó respuesta por un fallo técnico del servidor).' },
        ],
      },
      {
        heading: '4. Propiedad Intelectual e Imágenes',
        items: [
          { label: 'Contenido del Usuario', text: 'Los textos y la estructura de las presentaciones pertenecen al creador. Si el usuario decide "Publicar" su trabajo en la galería comunitaria, otorga permiso implícito para que otros usuarios puedan clonar dicho proyecto gratuitamente.' },
          { label: 'Integración de Unsplash', text: 'El catálogo de imágenes es proporcionado por la API de Unsplash. Las imágenes pertenecen a sus respectivos autores y se muestran con atribución directa al fotógrafo y enlace a la fuente. Las búsquedas de imágenes son anónimas: no existe vínculo entre tu perfil y tus preferencias de búsqueda en servidores externos. Está prohibido comercializar las imágenes fuera del entorno de la presentación.' },
          { label: 'Contenido Generado por IA Externa', text: 'La plataforma permite importar estructuras desde asistentes externos (ChatGPT, Gemini). Las imágenes vinculadas en esos contenidos no son validadas por Unsplash. El usuario asume plena responsabilidad sobre su uso y se compromete a verificar sus licencias o reemplazarlas con el buscador integrado.' },
        ],
      },
      {
        heading: '5. Gamificación y Sistema de XP',
        items: [
          { label: 'Puntos de Experiencia (XP)', text: 'Los usuarios ganan puntos por crear contenido real, invitar colaboradores y proyectar en vivo.' },
          { label: 'Anti-Farming', text: 'Queda prohibida la creación de secciones vacías o el uso de scripts para subir de rango artificialmente. El Administrador se reserva el derecho de resetear los puntos de cualquier cuenta fraudulenta.' },
          { label: 'Límites', text: 'Las cuentas gratuitas tienen un límite de 5 presentaciones activas. Al subir de rango se desbloquean beneficios adicionales y temas visuales premium.' },
        ],
      },
      {
        heading: '6. Financiamiento y Transparencia del Proyecto',
        text: 'Pablito Expo es un proyecto independiente desarrollado con recursos propios. No vendemos, alquilamos ni comercializamos los datos de los usuarios con terceros. Nuestra única fuente de ingresos son las recargas directas de créditos y el apoyo voluntario de la comunidad. Cualquier donación se destina íntegramente al mantenimiento de la infraestructura (servidores, APIs y desarrollo continuo).',
      },
      {
        heading: '7. Política de Menores',
        text: 'El uso gratuito de la plataforma está permitido bajo supervisión. Sin embargo, las transacciones (como la recarga de créditos) son exclusivas para mayores de 18 años para asegurar un uso responsable.',
      },
    ],
  },
  {
    title: 'Política de Privacidad',
    icon: '🔒',
    accent: '#a78bfa',
    content: [
      {
        heading: '1. Recopilación Minimalista de Datos',
        text: 'En Pablito Expo aplicamos el principio de minimización de datos. Solo recolectamos lo estrictamente necesario para el funcionamiento del servicio:',
        items: [
          { label: 'Identidad', text: 'Correo electrónico (para login y seguridad) y nombre de usuario único "Nigma", para que el asistente pueda dirigirse a ti de forma personalizada.' },
          { label: 'Datos de Uso', text: 'Historial de presentaciones, créditos de IA consumidos y puntos de XP acumulados.' },
          { label: 'Seguridad', text: 'Identificador de hardware anónimo para prevenir fraudes y ataques de bots. No rastreamos tu navegación externa.' },
        ],
      },
      {
        heading: '2. Interacción con Terceros (Aislamiento de Datos)',
        text: 'Compartimos datos mínimos estrictamente necesarios con los siguientes proveedores. En ningún caso compartimos tu correo, IP real ni datos de cuenta con los motores de IA:',
        items: [
          { label: 'Supabase', text: 'Almacenamiento seguro de la base de datos, autenticación y ejecución de funciones en el servidor (Edge Functions). Actúa como intermediario entre tu navegador y los proveedores de IA.' },
          { label: 'DeepSeek (Todas las personalidades)', text: 'Solo se envía el contenido del mensaje (prompt) y el contexto inmediato de los últimos 10 mensajes. No enviamos tu correo, IP ni datos de cuenta. No compartimos ningún dato personal con este proveedor.' },
          { label: 'Unsplash', text: 'Las búsquedas de imágenes son completamente anónimas. No existe ningún vínculo entre tu perfil y tus preferencias de búsqueda en sus servidores.' },
        ],
      },
      {
        heading: '3. Memoria Efímera y Control de Conversaciones',
        items: [
          { label: 'Sin Historial Permanente en Servidor', text: 'El sistema no almacena historiales de conversación en nuestra base de datos. Solo se mantiene en memoria durante la sesión activa para enviar el contexto a la IA.' },
          { label: 'Almacenamiento Local', text: 'Las conversaciones se guardan en el localStorage de tu propio navegador (máx. 5 chats, 10 mensajes c/u). Estos datos no abandonan tu dispositivo.' },
          { label: 'Control Total', text: 'Puedes eliminar cualquier conversación desde el panel del asistente en cualquier momento usando el botón 🗑️ disponible en el historial.' },
          { label: 'Nota sobre Caché', text: 'El sistema no interfiere con la memoria caché de tu navegador. La gestión de esos datos locales queda bajo control exclusivo del usuario.' },
        ],
      },
      {
        heading: '4. Protección y "Soft Delete"',
        items: [
          { label: 'Papelera Secreta', text: 'Cuando eliminas una presentación, el sistema aplica un "Borrado Lógico". El contenido se oculta de tu vista y se archiva temporalmente, permitiendo recuperarlo en caso de errores accidentales o ataques de colaboradores maliciosos.' },
          { label: 'Seguridad del Servidor', text: 'Utilizamos cifrado y túneles seguros (HTTPS/TLS) para proteger la comunicación entre tu navegador y nuestra base de datos.' },
        ],
      },
      {
        heading: '5. Derechos del Usuario (ARCO)',
        text: 'Puedes ejercer tus derechos ARCO (Acceso, Rectificación, Cancelación y Oposición), o solicitar la eliminación permanente de tus datos (como tu Nigma o presentaciones) escribiendo a: pabloclsa87@gmail.com. Esta solicitud se procesará en un plazo máximo de 72 horas hábiles.',
      },
    ],
  },
  {
    title: 'Disposiciones Finales',
    icon: '🛡️',
    accent: '#10b981',
    content: [
      {
        heading: '1. Jurisdicción y Modificaciones',
        text: 'Este contrato se rige por las leyes de la República del Perú. Cualquier controversia será resuelta en los juzgados de Huánuco. Samuel Y. Pablo Claudio se reserva el derecho de modificar estos términos para adaptarlos a nuevas funciones o cambios legales, notificando a los usuarios a través de la plataforma. El uso continuado del servicio implica la aceptación de los nuevos términos.',
      },
      {
        heading: '2. Soporte y Contacto',
        text: 'Para reportar fallos técnicos o ejercer tus derechos de rectificación y eliminación de datos, puedes contactar al administrador en: pabloclsa87@gmail.com',
      },
      {
        heading: '3. Limitación de Responsabilidad Técnica',
        text: 'Pablito Expo no garantiza disponibilidad del 100% y no se hace responsable por pérdidas de información debidas a fallos en proveedores externos (como DeepSeek) o caídas de red.',
      },
    ],
  },
];

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#06060d', fontFamily: "'Inter','Segoe UI',sans-serif", padding: '0 0 80px' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, background: 'rgba(6,6,13,0.95)', backdropFilter: 'blur(20px)', zIndex: 10 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '4px 8px' }}
        >
          ←
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' }}>
            Términos y Política de Privacidad
          </h1>
          <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
            Pablito Expo · Última actualización: Abril 2026
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px 0' }}>

        {SECTIONS.map((section, si) => (
          <motion.div
            key={si}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.1, duration: 0.5 }}
            style={{ marginBottom: '48px' }}
          >
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', borderBottom: `1px solid ${section.accent}22`, paddingBottom: '16px' }}>
              <span style={{ fontSize: '1.5rem' }}>{section.icon}</span>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: section.accent, letterSpacing: '-0.03em' }}>
                {section.title}
              </h2>
            </div>

            {section.content.map((block, bi) => (
              <div key={bi} style={{ marginBottom: '28px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: '700', color: '#e2e8f0', letterSpacing: '-0.01em' }}>
                  {block.heading}
                </h3>
                {block.text && (
                  <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {block.text}
                  </p>
                )}
                {block.items && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {block.items.map((item, ii) => (
                      <div key={ii} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: section.accent, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          {item.label}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        ))}

        {/* Footer note */}
        <div style={{ textAlign: 'center', padding: '32px 0', borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.2)', fontSize: '12px', lineHeight: 2 }}>
          <p style={{ margin: 0 }}>Al utilizar esta plataforma, te unes a una comunidad que valora la transparencia tecnológica y la colaboración académica.</p>
          <p style={{ margin: 0 }}>© 2025–2026 <span style={{ color: 'rgba(168,85,247,0.6)' }}>pablitodp</span> · Samuel Y. Pablo Claudio · Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
