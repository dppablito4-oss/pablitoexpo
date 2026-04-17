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
        text: `Bienvenido a la plataforma de edición de presentaciones desarrollado por Samuel Y. Pablo Claudio. Al registrarte y utilizar nuestras herramientas, aceptas cumplir con las reglas aquí descritas. Este es un entorno educativo y tecnológico en fase de desarrollo, diseñado para potenciar la creación de contenido visual dinámico mediante bloques y asistencia de IA.`,
      },
      {
        heading: '2. Cuentas, Verificación y Seguridad',
        items: [
          { label: 'Registro y OTP', text: 'Para acceder a funciones avanzadas (IA, bloques complejos, sistema de rangos), es obligatorio verificar la cuenta mediante un código OTP enviado a tu correo electrónico.' },
          { label: 'Identidad Única', text: 'El sistema utiliza identificadores técnicos anónimos del dispositivo para prevenir fraude, ataques de bots y asegurar la integridad del sistema de puntos. Este identificador no identifica a la persona, sino que vincula la actividad al equipo para evitar el abuso de créditos gratuitos. El usuario puede solicitar la eliminación de estos datos contactando al administrador.' },
          { label: 'Responsabilidad', text: 'El usuario es responsable de la custodia de sus credenciales. No compartas tu acceso con terceros.' },
        ],
      },
      {
        heading: '3. Uso del Asistente "Pablito" y Sistema de Créditos',
        items: [
          { label: 'Asistente Digital', text: 'El asistente Pablito (Pablo - Planificación de Tareas Complejas) utiliza la API de OpenAI. Cada consulta consume créditos de la billetera del usuario.' },
          { label: 'Consumo y Niveles', text: 'Existen tres niveles de respuesta (Corta, Media y Larga). El costo en créditos se indica antes de cada consulta.' },
          { label: 'Recargas', text: 'Las recargas de créditos para el asistente Pablito se gestionan de forma manual y directa (transferencia bancaria, Yape/Plin o efectivo).' },
          { label: 'No Reembolsos', text: 'Una vez asignados los créditos, no existen reembolsos, salvo error verificable del sistema (ej. se descontaron créditos pero la IA no generó respuesta por un fallo técnico del servidor).' },
        ],
      },
      {
        heading: '4. Propiedad Intelectual e Imágenes',
        items: [
          { label: 'Contenido del Usuario', text: 'Los textos y la estructura de las presentaciones pertenecen al creador. Si el usuario decide "Publicar" su trabajo en la galería comunitaria, otorga permiso implícito para que otros usuarios puedan clonar dicho proyecto gratuitamente.' },
          { label: 'Integración de Unsplash', text: 'El catálogo de imágenes es proporcionado por la API de Unsplash. Las imágenes pertenecen a sus respectivos autores. Las imágenes incluyen un enlace directo a la fuente original y el nombre del autor, respetando la Licencia de Unsplash. Está prohibido descargar o intentar comercializar las imágenes fuera del entorno de la presentación.' },
          { label: 'Hotlinking', text: 'No almacenamos imágenes en nuestros servidores; estas cargan directamente desde Unsplash para garantizar la calidad y el cumplimiento de sus licencias.' },
          { label: 'Contenido Generado por IA y Responsabilidad de Imágenes Externas', text: 'La plataforma permite importar estructuras generadas por asistentes de IA externos (ChatGPT, Gemini). Las imágenes vinculadas en estos contenidos no pertenecen al catálogo verificado de Unsplash. La plataforma no valida ni garantiza los derechos de uso de dichos enlaces. El usuario asume plena responsabilidad sobre su uso y se compromete a verificar sus licencias o reemplazarlas con el buscador integrado de Unsplash.' },
        ],
      },
      {
        heading: '5. Gamificación y Sistema de XP',
        items: [
          { label: 'Puntos de Experiencia (XP)', text: 'Los usuarios ganan puntos por crear contenido real, invitar colaboradores y proyectar en vivo.' },
          { label: 'Anti-Farming', text: 'Queda prohibida la creación de secciones vacías o el uso de scripts para subir de rango artificialmente. El Administrador se reserva el derecho de resetear los puntos de cualquier cuenta fraudulenta.' },
          { label: 'Límites', text: 'Las cuentas gratuitas tienen un límite de 5 presentaciones activas. Al subir de rango, se desbloquean más beneficios y temas visuales premium.' },
        ],
      },
      {
        heading: '6. Edad Mínima y Responsabilidad Legal',
        text: 'El usuario debe ser mayor de 18 años para realizar recargas de créditos. En caso de ser menor de edad, deberá contar con la autorización y supervisión de un padre o tutor legal para cualquier transacción o uso de la plataforma.',
      },
    ],
  },
  {
    title: 'Política de Privacidad',
    icon: '🔒',
    accent: '#a78bfa',
    content: [
      {
        heading: '1. Recopilación de Datos',
        items: [
          { label: 'Datos de Registro', text: 'Correo electrónico y nombre de usuario proporcionados voluntariamente.' },
          { label: 'Datos de Uso', text: 'Historial de presentaciones, créditos de IA consumidos, puntos de XP y rangos alcanzados.' },
          { label: 'Seguridad', text: 'Identificador de hardware anónimo para prevenir fraudes y ataques de bots. No rastreamos tu navegación externa ni vendemos esta información a terceros.' },
        ],
      },
      {
        heading: '2. Proveedores de Servicios (Terceros)',
        text: 'Compartimos datos estrictamente necesarios con los siguientes proveedores:',
        items: [
          { label: 'Supabase', text: 'Almacenamiento seguro de la base de datos y autenticación.' },
          { label: 'OpenAI', text: 'Procesamiento de las consultas enviadas a través del asistente "Pablito".' },
          { label: 'Unsplash', text: 'Gestión de solicitudes de imágenes mediante su API.' },
        ],
      },
      {
        heading: '3. Protección y "Soft Delete"',
        items: [
          { label: 'Papelera Secreta', text: 'Cuando eliminas una presentación, el sistema aplica un "Borrado Lógico". El contenido se oculta de tu vista y se archiva temporalmente. Esto permite recuperar tu trabajo en caso de ataques maliciosos de colaboradores o errores accidentales.' },
          { label: 'Seguridad del Servidor', text: 'Utilizamos cifrado y túneles seguros para proteger la comunicación entre tu navegador y nuestra base de datos.' },
        ],
      },
      {
        heading: '4. Derechos del Usuario',
        text: 'Puedes solicitar la eliminación permanente de tu cuenta y todos tus datos asociados en cualquier momento contactando directamente con el administrador del sistema.',
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
                  <p style={{ margin: '0 0 12px', fontSize: '0.875rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
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
