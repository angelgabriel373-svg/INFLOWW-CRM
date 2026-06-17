# Desplegar el CRM gratis (Render + Neon)

Stack 100% gratis y con datos que **no se borran**:
- **Neon** → base de datos PostgreSQL gratis (guarda los datos).
- **Render** → servidor que ejecuta el CRM (web + API + chat), plan free.
- **GitHub** → donde vive el código para que Render lo despliegue.

> ⚠️ El plan free de Render **se duerme** tras ~15 min sin uso. La primera carga
> tras dormirse tarda ~30-50s. Para un equipo en turnos continuos puede molestar;
> si pasa a estorbar, un VPS de ~4€/mes lo soluciona (siempre encendido).

---

## Resumen (lo que vas a hacer una sola vez)
1. Crear cuenta en **GitHub** y subir el código (te paso el comando).
2. Crear cuenta en **Neon** y copiar la cadena de conexión.
3. Crear cuenta en **Render**, conectar el repo y pegar 4 datos.

Total: ~15 minutos.

---

## 1. Subir el código a GitHub
1. Crea cuenta en https://github.com (si no tienes).
2. Crea un repositorio **vacío y privado** llamado `infloww-crm` (botón **New**, no marques añadir README).
3. Copia la URL que te da (algo como `https://github.com/TU_USUARIO/infloww-crm.git`).
4. En tu PC, dime esa URL y yo ejecuto el `git push` (te saldrá una ventana del navegador para iniciar sesión en GitHub la primera vez).

## 2. Base de datos gratis (Neon)
1. Crea cuenta en https://neon.tech (puedes entrar con tu Google).
2. **Create project** → nombre `ofm-crm` → región Europa (Frankfurt).
3. En **Connection string**, copia la URL que empieza por `postgresql://...`
   (marca la opción "Pooled connection" si aparece). **Guárdala**, es para el paso 3.

## 3. Servidor gratis (Render)
1. Crea cuenta en https://render.com con tu GitHub (botón "Sign in with GitHub").
2. **New +** → **Blueprint** → elige el repo `infloww-crm`. Render detecta el `render.yaml`.
3. Te pedirá rellenar las variables marcadas. Pega:
   | Variable | Qué pones |
   |---|---|
   | `DATABASE_URL` | La cadena `postgresql://...` de Neon (paso 2) |
   | `CLIENT_URL` | Déjalo vacío de momento; lo rellenas tras el primer deploy con la URL que te dé Render (ej. `https://ofm-crm.onrender.com`) |
   | `ADMIN_PASSWORD` | Tu contraseña de admin (fuerte, no `admin123`) |
   | `JUKI_PASSWORD` | La contraseña de Juki |
4. **Apply / Create**. Render instala, compila y arranca (primer deploy ~5 min).
5. Cuando termine, copia la URL pública (ej. `https://ofm-crm.onrender.com`),
   pégala en la variable `CLIENT_URL` (Environment → Edit) y guarda → se redespliega solo.

## ¡Listo!
- Entras tú y Juki desde **cualquier PC** en esa URL `https://ofm-crm.onrender.com`.
- Usuario admin: `admin` / la contraseña que pusiste en `ADMIN_PASSWORD`.
- Usuario chatter: `juki` / la de `JUKI_PASSWORD`.

---

## Notas
- Los datos viven en Neon → sobreviven a reinicios y redeploys.
- Las **imágenes subidas** en el plan free de Render se borran al redesplegar
  (disco temporal). Si necesitas que persistan, se guardan en un bucket gratis
  (Cloudflare R2 / Supabase Storage) — lo añadimos si hace falta.
- Cambia las contraseñas cuando quieras desde el panel de Render (variables) → redeploy.
