# OFM CRM — Clon de Infloww (coste cero)

CRM completo de gestión de modelos, trabajadores y chatters para agencias de OnlyFans Management. 100% open source, sin costes mensuales, control total de tus datos. Puede correr en local o en un VPS barato.

> Sustituye a Infloww para tu equipo: chat en tiempo real, gestión de modelos, roles y permisos, scripts de venta, estadísticas y exportación.

---

## ✨ Funcionalidades

- **Autenticación JWT** + contraseñas con bcrypt + roles (Admin / Manager / Chatter).
- **Panel de chatters**: cada chatter accede con su usuario y solo ve las modelos que tiene asignadas.
- **Chat en tiempo real** (Socket.io) estilo WhatsApp/Telegram: bandeja de entrada, hilo de mensajes, indicador "escribiendo", contador de no leídos.
- **Mensaje como la modelo**: cada mensaje queda firmado por el trabajador que lo envió.
- **Respuestas rápidas (scripts)** globales o por modelo, insertables con un clic.
- **PPV**: marca un mensaje como pago, define precio y registra la compra (suma al gasto del fan).
- **Adjuntar imágenes** y simulación de mensajes del fan (para probar el sistema).
- **CRUD de modelos**: redes sociales, precio de suscripción, foto, descripción, asignación de chatters.
- **Gestión de equipo**: crear usuarios, activar/desactivar, asignar modelos, control de turnos.
- **Dashboard** con gráficos (Chart.js): ingresos por modelo, conversión PPV, mensajes por chatter.
- **Tickets / incidencias** y **exportación de conversaciones a CSV**.
- **Diseño oscuro moderno y responsive** (móvil + escritorio).

## 🧰 Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js + Express |
| Tiempo real | Socket.io |
| ORM | Prisma |
| Base de datos | SQLite (por defecto) · PostgreSQL (opcional) |
| Auth | JWT + bcryptjs |
| Frontend | React + Vite |
| Estilos | Tailwind CSS |
| Gráficos | Chart.js + react-chartjs-2 |

Todo gratuito y open source. SQLite no requiere ningún servidor de base de datos.

---

## 🚀 Instalación

### Requisitos
- [Node.js 18+](https://nodejs.org) y npm.
- (Opcional) Docker, si prefieres el despliegue en un comando.

### Opción A — Local (recomendado para desarrollo)

**Windows (PowerShell):**
```powershell
cd infloww-crm
./setup.ps1
npm run dev
```

**Linux / Mac:**
```bash
cd infloww-crm
sh setup.sh
npm run dev
```

**Manual (cualquier sistema):**
```bash
cd infloww-crm
npm install
npm --prefix server install
npm --prefix client install
# crea server/.env (copia de server/.env.example) y prepara la BD:
npm --prefix server run db:setup
npm run dev
```

Esto levanta:
- **Frontend**: http://localhost:5173
- **API + WebSocket**: http://localhost:4000

> `npm run dev` usa `concurrently` para arrancar backend y frontend juntos.

### Opción B — Docker (un solo comando, ideal para VPS)

```bash
cd infloww-crm
docker compose up --build
```

Aplicación disponible en **http://localhost:4000** (el backend sirve también el frontend ya compilado). La base de datos y las imágenes subidas se guardan en volúmenes persistentes. El seed se ejecuta automáticamente la primera vez.

---

## 🔑 Usuarios de ejemplo (seed)

| Rol | Usuario | Contraseña |
|---|---|---|
| Admin | `admin` | `admin123` |
| Manager (Team Leader) | `salvador` | `manager123` |
| Chatter | `giovanni` | `chatter123` |
| Chatter | `luis` | `chatter123` |

> En la pantalla de login puedes hacer clic en los accesos de prueba para rellenarlos.
> **Cambia estas contraseñas** y el `JWT_SECRET` antes de usar en producción.

---

## 👤 Qué ve cada rol

- **Admin**: todo. Crea/edita/elimina usuarios y modelos, asigna chatters, gestiona scripts y tickets.
- **Manager**: todas las modelos y conversaciones, crea modelos y scripts, gestiona tickets. No elimina usuarios.
- **Chatter**: solo las modelos que tiene asignadas y sus conversaciones. Chatea, usa scripts y abre tickets.

---

## 📡 API (resumen)

Base: `http://localhost:4000/api`. Todas las rutas (salvo login) requieren cabecera `Authorization: Bearer <token>`.

| Método | Ruta | Descripción | Rol |
|---|---|---|---|
| POST | `/auth/login` | Login (`identifier` = email o usuario) | público |
| GET | `/auth/me` | Usuario actual | auth |
| POST | `/auth/logout` | Cierra sesión de trabajo | auth |
| GET | `/users` | Lista de usuarios | admin/manager |
| POST | `/users` | Crear usuario | admin |
| PUT | `/users/:id` | Editar usuario | admin |
| PUT | `/users/:id/assignments` | Reasignar modelos | admin |
| DELETE | `/users/:id` | Eliminar usuario | admin |
| GET | `/models` | Modelos accesibles | auth |
| POST/PUT | `/models[/:id]` | Crear/editar modelo | admin/manager |
| DELETE | `/models/:id` | Eliminar modelo | admin |
| GET | `/conversations` | Bandeja (filtros `modelId`, `q`) | auth |
| GET | `/conversations/:id` | Hilo completo | auth |
| POST | `/conversations/:id/messages` | Enviar como la modelo | auth |
| POST | `/conversations/:id/simulate-fan` | Simular mensaje del fan | auth |
| PATCH | `/messages/:id/purchase` | Marcar PPV comprado | auth |
| GET/POST/PUT/DELETE | `/scripts` | Respuestas rápidas | ver/auth, editar/admin-manager |
| GET/POST/PATCH | `/tickets` | Incidencias | auth |
| GET | `/stats/overview` | KPIs del dashboard | auth |
| POST | `/uploads` | Subir imagen (multipart `file`) | auth |
| GET | `/export/conversations/:id.csv` | Exportar conversación | auth |

**Eventos WebSocket**: `conversation:join` / `conversation:leave`, `model:join`, `typing`, y recibidos `message:new`, `message:updated`, `conversation:updated`.

---

## 🐘 Usar PostgreSQL en lugar de SQLite (opcional)

1. En `server/prisma/schema.prisma` cambia el `datasource`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. En `server/.env` pon tu cadena: `DATABASE_URL="postgresql://user:pass@localhost:5432/ofmcrm"`.
3. Ejecuta `npm --prefix server run db:setup`.

Puedes usar PostgreSQL gratis en local o un plan free de cualquier proveedor.

---

## 📁 Estructura

```
infloww-crm/
├── package.json            # scripts raíz (dev, setup) con concurrently
├── docker-compose.yml      # despliegue en un comando
├── Dockerfile
├── setup.ps1 / setup.sh    # configuración inicial
├── server/                 # backend Express + Prisma + Socket.io
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── index.js        # servidor HTTP + WebSocket
│       ├── socket.js
│       ├── lib/            # prisma, auth (jwt/bcrypt)
│       ├── middleware/     # authenticate, requireRole, accesos por rol
│       └── routes/         # auth, users, models, conversations, messages,
│                           # scripts, tickets, stats, uploads, export
└── client/                 # frontend React + Vite + Tailwind
    └── src/
        ├── api.js          # wrapper fetch + JWT
        ├── socket.js
        ├── context/AuthContext.jsx
        ├── components/Layout.jsx
        └── pages/          # Login, Dashboard, Chat, Models, Users, Scripts, Tickets
```

---

## 🔒 Producción (checklist mínimo)

- Cambia `JWT_SECRET` por un valor largo y aleatorio.
- Cambia todas las contraseñas del seed.
- Sirve detrás de HTTPS (nginx / Caddy con certificado gratuito Let's Encrypt).
- Haz backups del volumen de la base de datos.

---

## ⚠️ Notas

- El chat con "fans" es interno/simulado: este CRM **no** se conecta a la API de OnlyFans (no existe API pública oficial). Sirve como panel de gestión y registro para tu equipo. La integración real con plataformas externas requeriría sus respectivas APIs/automatizaciones.
- Pensado para uso por mayores de edad y gestión de cuentas propias con consentimiento.
