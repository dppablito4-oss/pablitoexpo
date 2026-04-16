# PablitoExpo — Presentaciones interactivas (Proyecto inicial)

Este repositorio contiene una demo ligera de una presentación Reveal.js con control remoto por Supabase.

Estructura:
- `index.html` — Vista del proyector/PC (Reveal.js + KaTeX).
- `control.html` — Panel táctil para el móvil (envía eventos a Supabase).
- `style.css` — Estilos principales (dark glassmorphism).
- `app.js` — Lógica compartida (inicializa Reveal, escucha/manda eventos).
- `auth.js` — Cliente Supabase central (rellena `SUPABASE_URL` y `SUPABASE_ANON_KEY`).
- `scripts/backup_supabase.py` — Script opcional para backups (ver más abajo).

---

## Fase 1 — Preparar repositorio y Supabase

1. Crea un repositorio en GitHub (por ejemplo `pablitoexpo`) y sube este proyecto:

```bash
git init
git add .
git commit -m "Initial web remote-presentation demo"
# usa la CLI de GitHub para crear el repo y hacer push (opcional)
# gh repo create tuUsuario/pablitoexpo --public --source=. --push
```

2. Habilita GitHub Pages en la rama `main` (Settings → Pages → Branch `main` / root).

3. Crea un proyecto en Supabase (https://app.supabase.com)
   - Anota `SUPABASE_URL` y `SUPABASE_ANON_KEY` en Project → Settings → API.
   - En Project → Settings → Realtime asegúrate que Realtime esté habilitado.

4. Edita `auth.js` y reemplaza las constantes con tus credenciales.

---

## Fase 2 — Ejecutar localmente

Sirve la carpeta estática y prueba en tu red local:

```bash
# desde la raíz del repo
python -m http.server 8000
# o
npx serve . -l 8000
```

- Abre `http://localhost:8000/index.html` en el PC (proyector).
- Abre `http://localhost:8000/control.html` en tu móvil (con la misma red o usando datos móviles si subes a Pages).

---

## Fase 3 — Actualizar credenciales y probar

- Rellena `auth.js` con `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
- Sube (push) a `main` y habilita Pages si quieres probar a través de internet.

---

## Fase 4 — Backups (opcional)

Hay un script de ejemplo `scripts/backup_supabase.py` que consulta tablas via REST y guarda un JSON.

```bash
pip install requests
python scripts/backup_supabase.py
```

Programa la ejecución semanal con el programador de tareas del sistema (cron / Task Scheduler).

---

## Notas técnicas importantes

- Reemplaza las credenciales en `auth.js` antes de probar.
- No hay autenticación de usuarios en esta demo (uso de anon key). Ten cuidado con datos sensibles.
- Si tu control y proyector están en redes diferentes, usa GitHub Pages o despliegue público para que ambos accedan al mismo `SUPABASE_URL`.

---

¿Quieres que yo prepare el `gh` push (si me das permiso para crear un repo remoto) o que haga un commit local y te muestre los comandos exactos para desplegar en Pages?