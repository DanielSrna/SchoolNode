# SchoolNode

Sistema de gestión escolar para la automatización de matrículas y el control financiero de centros de educación no formal. Desarrollado bajo el patrón **Modelo-Vista-Controlador (MVC)** con Node.js y MongoDB.

Proyecto de grado aplicado — Universidad Nacional Abierta y a Distancia (UNAD), Ingeniería de Sistemas, 2026.

---

## 🚀 Inicio Rápido

### Requisitos previos
- Node.js **v20+** (obligatorio para `node:test` y `fetch` nativo)
- MongoDB Atlas (o MongoDB local en `127.0.0.1:27017` para las pruebas)
- Docker (opcional, para contenedores)
- Cuenta de Stripe Developer (para pagos en línea)

### Instalación local

```bash
# 1. Clonar e instalar
git clone git@github.com:DanielSrna/SchoolNode.git
cd SchoolNode
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (ver sección "Variables de entorno")

# 3. Ejecutar seed de datos (opcional, para datos de demostración)
npm run seed

# 4. Iniciar el servidor
npm run dev
# Acceder a http://localhost:3000
```

> ⚠️ **Importante:** en modo producción (`NODE_ENV=production`) las cookies de sesión son `Secure` (solo HTTPS) y las credenciales de prueba NO se muestran en la interfaz.

### Instalación con Docker

```bash
docker-compose up -d
docker-compose exec app npm run seed
docker-compose logs -f app
```

---

## ⚙️ Variables de Entorno

| Variable | Descripción |
|---|---|
| `NODE_ENV` | `development`, `production` o `test` |
| `PORT` | Puerto del servidor (por defecto 3000) |
| `APP_URL` | URL pública de la app (usada en callbacks de Stripe y correos) |
| `MONGODB_URI` | Cadena de conexión a MongoDB (Atlas o local) |
| `JWT_SECRET` | Secreto de firma de los access tokens (15 min) |
| `JWT_REFRESH_SECRET` | Secreto de firma de los refresh tokens (7 días) |
| `JWT_ACCESS_EXPIRATION` | Vida del access token (por defecto `15m`) |
| `JWT_REFRESH_EXPIRATION` | Vida del refresh token (por defecto `7d`) |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe (test o live) |
| `STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secreto del webhook de Stripe |
| `EMAIL_USER` | Cuenta Gmail que envía los correos |
| `EMAIL_APP_PASSWORD` | Contraseña de aplicación de Google (no la normal) |
| `LOGIN_RATE_LIMIT_MAX` | Máx. intentos de login por IP/15 min (por defecto 10) |
| `API_RATE_LIMIT_MAX` | Máx. peticiones por IP/15 min (por defecto 300) |

---

## 🧪 Pruebas Automatizadas

Suite completa con el runner nativo de Node (`node:test`): **131 pruebas**, todas verificando la API HTTP real contra un MongoDB local (cada archivo usa su propia base `schoolnode_test_*`).

```bash
npm test            # Requiere MongoDB local en 127.0.0.1:27017
npm run check:frontend   # Verifica estilos, SRI y recursos servidos
npm run check:correos    # Envía correos REALES (SMTP Gmail) a CORREO_DESTINO
```

### Cobertura por archivo

| Archivo | Cubre |
|---|---|
| `tests/modelos.test.js` | Modelos Mongoose (hasheo, validaciones, unicidad, reglas de negocio) |
| `tests/api.test.js` | Login, refresh, logout, validaciones, flujo completo estudiante→matrícula→pago→factura |
| `tests/roles.test.js` | Matriz completa de autorización admin/empleado (401/403/200) |
| `tests/auth.test.js` | Rotación de tokens, reuso rechazado, auto-refresh, cookies httpOnly, usuario desactivado |
| `tests/matriculas.test.js` | Doble matrícula, cupo de aula, pagos parciales, morosidad, migración, regresiones |
| `tests/pagos.test.js` | Sesión checkout, pagos físicos/simulados, webhook con firma HMAC e idempotencia |
| `tests/email.test.js` | Códigos de cambio de credenciales, recordatorio de pago (correo en memoria) |
| `tests/facturas.test.js` | PDF válido, tipos, 404, detalle de pagos, refs nulas |
| `tests/estudiantes.test.js` | Paginación, búsqueda, duplicados, restricciones de borrado |
| `tests/empleados.test.js` | CRUD de empleados y configuración |
| `tests/notificaciones.test.js` | Notificaciones internas (creación, roles, contador, leídas) |
| `tests/ratelimit.test.js` | Rate limiting del login (429 después del límite) |
| `tests/webhook.test.js` | Firma de webhook válida/inválida, eventos ignorados |

### Bugs críticos detectados y corregidos por la suite
1. **Rotación de refresh tokens rota** — los tokens eran idénticos dentro del mismo segundo (`iat` truncado) y bcrypt trunca a 72 bytes; el reuso del token viejo pasaba la verificación. Fix: `jti` (UUID) al inicio del payload.
2. **Auto-refresh nunca funcionaba** — faltaba `await` en `bcrypt.compare` y se releía la cookie vieja. Fix en `authMiddleware`.
3. **Webhook de Stripe duplicaba pagos** — un retry del mismo evento acreditaba el pago dos veces. Fix: idempotencia por `payment_intent`.
4. **Índice único impedía re-matricular** — el índice `(estudiante, curso)` bloqueaba matrículas canceladas. Fix: índice parcial solo para estado `activa`.
5. **Matrículas canceladas volvían a "moroso"** — `verificarVencimiento()` no respetaba el estado cancelado.

---

## 🔐 Seguridad

- **Contraseñas** hasheadas con `bcryptjs` (10 rondas) — nunca en texto plano
- **Refresh tokens** guardados hasheados en BD (un robo de BD no expone sesiones)
- **Sesiones con rotación de tokens**: access (15 min) + refresh (7 días) en cookies `httpOnly` + `sameSite=lax` + `secure` en producción, con renovación automática
- **RBAC**: roles `admin` y `empleado` con matriz de permisos por endpoint
- **Doble validación**: `express-validator` en las rutas + restricciones en los esquemas Mongoose
- **Webhook de Stripe** verificado con firma HMAC (body crudo) e idempotente
- **Rate limiting** por IP: login (10/15 min) y API general (300/15 min), exento el webhook de Stripe
- **SRI (Subresource Integrity)** en los assets de Bootstrap — vendored localmente, sin CDN
- **Modo oscuro** persistente con `data-bs-theme` (Bootstrap 5.3)

---

## 🏗️ Arquitectura

```
SchoolNode/
├── src/
│   ├── config/         # Configuraciones (DB, JWT, Stripe, mailer)
│   ├── controllers/    # Solo orquestación (req → servicio/modelo → res)
│   ├── models/         # Modelos Mongoose: CRUD en statics, acciones en methods
│   ├── services/       # Lógica transversal (auth/sesiones, pagos, facturas PDF)
│   ├── routes/         # Rutas Express + validaciones (express-validator)
│   ├── middleware/     # Auth (con auto-refresh), RBAC, validarCampos
│   ├── views/          # Plantillas EJS (sidebar/header en partials)
│   ├── public/         # CSS, JS, vendor (Bootstrap local)
│   ├── seeds/          # Seed y utilidades (arreglar-saldos)
│   └── utils/          # Logger Winston, cookies, ErrorAPI
├── scripts/            # check:frontend y check:correos
├── tests/              # 131 pruebas (node:test)
├── Dockerfile
├── docker-compose.yml
└── documentacion-entidades.txt  # Documentación técnica de las entidades
```

### Entidades (colecciones)
- **User** — admin/empleado, sesiones con refresh token hasheado
- **Estudiante** — cédula única, paginación y búsqueda
- **Curso** — precio y duración; el precio define el saldo inicial de la matrícula
- **Aula** — capacidad y población calculada en tiempo real (control de cupo)
- **Matricula** (entidad central) — estado (activa/vencida/morosa/cancelada), pagos embebidos, saldo recalculado desde el precio, índice único parcial para activas
- **Configuracion** — singleton con identidad institucional (nombre, NIT, color, facturación)
- **Notificacion** — mensajes internos empleado → admin
- **TokenAccion** — códigos de 6 dígitos para cambio de credenciales (10 min de vida)

---

## 🔌 API Endpoints

### Autenticación
| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | público | Iniciar sesión (rate limited) |
| POST | `/api/auth/refresh` | cookie | Renovar sesión (rotación) |
| POST | `/api/auth/logout` | cookie | Cerrar sesión |
| GET | `/api/auth/me` | auth | Usuario actual |
| POST | `/api/auth/cambiar-email` | auth | Solicitar cambio de email (código) |
| POST | `/api/auth/cambiar-password` | auth | Solicitar cambio de contraseña (código) |
| POST | `/api/auth/confirmar-cambio` | auth | Confirmar cambio con código |

### Gestión (CRUD)
| Recurso | Ruta base | Rol |
|---|---|---|
| Empleados | `/api/empleados` | solo admin |
| Cursos | `/api/cursos` | ver: todos · escribir: admin |
| Aulas | `/api/aulas` | ver: todos · escribir: admin |
| Estudiantes | `/api/estudiantes` | ver: todos · escribir: admin |
| Matrículas | `/api/matriculas` | ver: todos · escribir: admin |
| Configuración | `/api/configuracion` | solo admin |
| Notificaciones | `/api/notificaciones` | auth (crear: solo empleados) |

### Matrículas — acciones
- `POST /api/matriculas/migrar` — migrar de aula (valida cupo) · admin
- `POST /api/matriculas/:id/notificar` — envía recordatorio de pago al correo del estudiante · auth

### Pagos
- `POST /api/pagos/crear-sesion` — sesión de Stripe (o simulación) · admin/empleado
- `POST /api/pagos/confirmar-simulacion` — confirma pago simulado · auth
- `POST /api/pagos/fisico` — registra pago físico · admin/empleado
- `POST /api/pagos/webhook/stripe` — webhook de Stripe (sin auth, firma HMAC, idempotente)
- `GET /api/pagos/factura/:tipo/:matriculaId` — factura PDF (`total` o `aporte`) · auth

### Notificaciones
- `POST /api/notificaciones` — crear (solo empleados → admins) · auth
- `GET /api/notificaciones` — recibidas (admin) / enviadas (empleado)
- `GET /api/notificaciones/no-leidas` — contador para la campana
- `PATCH /api/notificaciones/:id/leida` — marcar leída (solo destinatario)

---

## 📧 Correos (Gmail SMTP)

En `NODE_ENV=test` los correos NO se envían: quedan en memoria para las pruebas. Fuera de test se envían por Gmail SMTP con las credenciales del `.env`.

Flujos que envían correo:
1. **Cambio de contraseña** — código al correo actual
2. **Cambio de email** — código al NUEVO correo
3. **Recordatorio de pago** — botón "Notificar" en matrículas, al correo del estudiante

Verificación real: `CORREO_DESTINO=tu@correo.com npm run check:correos`

---

## 💳 Configuración de Stripe

1. Crear cuenta en [Stripe Dashboard](https://dashboard.stripe.com/test)
2. Obtener claves API en Developers → API keys
3. Configurar webhook:
   - URL: `https://tu-dominio.com/api/pagos/webhook/stripe`
   - Eventos: `checkout.session.completed`
4. Copiar el webhook secret al `.env`
5. Con claves placeholder (`replace`/`change`) la app opera en **modo simulación** (sin dinero real)

---

## 📝 Scripts

```bash
npm run dev              # Desarrollo con nodemon
npm start                # Producción
npm start:prod           # Producción forzando NODE_ENV=production
npm test                 # 131 pruebas (requiere MongoDB local)
npm run check:frontend   # Verifica estilos/SRI/recursos del frontend
npm run check:correos    # Envía correos reales de verificación
npm run seed             # Seed de datos de demostración
npm run arreglar-saldos  # Recalcula totales/saldos de matrículas
npm run docker:up        # Levantar contenedores
npm run docker:down      # Detener contenedores
npm run docker:logs      # Ver logs
```

---

## 🎓 Universidad

Universidad Nacional Abierta y a Distancia (UNAD) — Ingeniería de Sistemas — 2026.

## 📄 Licencia

MIT License
