# 🚀 Guía de Despliegue - SchoolNode en Render

Esta guía te lleva paso a paso para desplegar SchoolNode en Render usando tu cuenta de MongoDB Atlas.

---

## 1. Pre-requisitos

- Cuenta en [Render](https://render.com) (gratis)
- Cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (gratis)
- Repositorio de GitHub con el código de SchoolNode
- Claves de Stripe (opcional para pagos reales, el simulador funciona sin ellas)

---

## 2. Subir el código a GitHub

```bash
cd /home/daniel/Documentos/Proyectos/SchoolNode
git add .
git commit -m "Prototipo TRL5 completo"
git push origin main
```

---

## 3. Crear servicio web en Render

1. Ve a [dashboard.render.com](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio `SchoolNode`
5. Configura el servicio:

| Campo | Valor |
|---|---|
| **Name** | `schoolnode` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm run start:prod` |
| **Plan** | `Free` |

---

## 4. Configurar Variables de Entorno

En la sección **"Environment Variables"** agrega estas variables:

| Variable | Valor | Notas |
|---|---|---|
| `NODE_ENV` | `production` | Obligatorio |
| `PORT` | `3000` | Render lo sobrescribe automáticamente |
| `MONGODB_URI` | `mongodb+srv://usuario:password@cluster.mongodb.net/schoolnode` | Tu conexión de Atlas |
| `JWT_SECRET` | Generar aleatorio | Click en "Generate" |
| `JWT_REFRESH_SECRET` | Generar aleatorio | Click en "Generate" |
| `JWT_ACCESS_EXPIRATION` | `15m` | |
| `JWT_REFRESH_EXPIRATION` | `7d` | |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Opcional (para Stripe real) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Opcional |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Opcional |
| `APP_URL` | `https://schoolnode-pwmx.onrender.com` | Tu URL de Render |
| `EMAIL_USER` | `e.mechanic98@gmail.com` | Cuenta Gmail que envía los correos |
| `EMAIL_APP_PASSWORD` | Contraseña de aplicación | [Crear aquí](https://myaccount.google.com/apppasswords) |

---

## 5. Configurar MongoDB Atlas para Render

1. Ve a [MongoDB Atlas](https://cloud.mongodb.com)
2. Click en tu clúster → **"Network Access"**
3. Click en **"Add IP Address"**
4. Agrega estas IPs de Render (o usa `0.0.0.0/0` para desarrollo):
   ```
   18.220.224.0/19
   18.220.224.1
   ```
   *Para desarrollo, puedes usar `0.0.0.0/0` que permite desde cualquier IP (solo para pruebas)*

5. Click en **"Save"**

---

## 6. Crear el servicio

1. Click en **"Create Web Service"**
2. Espera 2-3 minutos mientras Render:
   - Clona tu repositorio
   - Instala las dependencias (`npm install`)
   - Ejecuta `npm run start:prod`
3. Cuando esté listo, te dará una URL como: `https://schoolnode-xxxx.onrender.com`

---

## 7. Ejecutar el seed de datos

Hay dos opciones:

### Opción A: Usar la Shell de Render (recomendado)

1. En tu servicio de Render, ve a la pestaña **"Shell"**
2. Escribe:
   ```bash
   npm run seed
   ```
3. Espera a que termine

### Opción B: Agregar un script de inicio

Crea un archivo `scripts/seed.sh`:

```bash
#!/bin/bash
if [ -z "$SEED_EXECUTED" ]; then
  npm run seed
  export SEED_EXECUTED=1
fi
```

Y en **Build Command** pon: `npm install && ./scripts/seed.sh`

---

## 8. Activar pagos reales con Stripe (paso a paso)

Sin claves de Stripe la app funciona en **modo simulación**. Para cobros reales
(o de prueba con tarjeta `4242 4242 4242 4242`):

### Paso 1: Crear la cuenta y obtener las claves
1. Crea tu cuenta en [stripe.com](https://stripe.com) (modo **Test** activado).
2. Ve a **Developers → API keys**.
3. Copia la **Secret key** (`sk_test_...`) y la **Publishable key** (`pk_test_...`).

### Paso 2: Crear el webhook
1. Ve a **Developers → Webhooks → Add endpoint**.
2. URL del endpoint:
   ```
   https://schoolnode-pwmx.onrender.com/api/pagos/webhook/stripe
   ```
3. Evento a escuchar: `checkout.session.completed`.
4. Copia el **Signing secret** (`whsec_...`).

### Paso 3: Poner las variables en Render
En tu servicio de Render → **Environment**:

| Variable | Valor |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` (del paso 1) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (del paso 1) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (del paso 2) |
| `APP_URL` | `https://schoolnode-pwmx.onrender.com` |

Guarda y Render redespliega solo. Desde ese momento:
- "Pagar en línea" abre el **checkout real de Stripe** (en modo test no hay
  cobros reales; usa la tarjeta `4242 4242 4242 4242`, cualquier fecha futura
  y cualquier CVC).
- Stripe avisa al webhook y el pago se registra solo en la matrícula.
- El cliente vuelve a `/pagos/exito` (pantalla de confirmación).

> 💡 Si las claves tienen el texto `replace` o `change`, el sistema detecta
> que son placeholders y sigue en modo simulación: ideal para desarrollo local.

---

## 9. Acceder a la aplicación

1. Ve a tu URL: `https://tu-servicio.onrender.com`
2. Inicia sesión:
   - **Admin:** `admin@schoolnode.com` / `Admin123!`
   - **Empleado:** `empleado1@schoolnode.com` / `Empleado123!`

---

## ⚠️ Limitaciones del Plan Free

| Limitación | Detalle |
|---|---|
| **Sleep automático** | Después de 15 min de inactividad, el servicio se duerme. La primera petición puede tardar 30-60 segundos en responder. |
| **Build time** | Limitado a 15 minutos por build. |
| **Bandeja** | 100 GB/mes gratis. |
| **Sin volúmenes persistentes** | Los datos de archivos locales se pierden entre deploys. |

---

## 🔧 Troubleshooting

### El servicio se queda en "Deploying..."
- Revisa los logs en la pestaña "Logs"
- Asegúrate de que `startCommand` sea correcto

### "Error connecting to MongoDB"
- Verifica que la IP de Render esté permitida en Atlas
- Verifica que la contraseña de Atlas sea correcta (sin espacios)

### "Cannot find module"
- Asegúrate de que todas las dependencias estén en `dependencies`, no en `devDependencies`
- Verifica que el `startCommand` sea `npm run start:prod`

### La app funciona pero muy lento
- Es normal en el plan Free (15 min de inactividad = se duerme)
- Puedes usar un servicio como [UptimeRobot](https://uptimerobot.com) para ping cada 10 minutos y mantenerlo despierto

---

## 📊 Monitoreo

En Render puedes ver:
- **Logs**: Errores y actividad de la app
- **Metrics**: CPU, memoria, requests
- **Events**: Deploys y reinicios

---

## 🔄 Actualizaciones

Cada vez que hagas `git push` a la rama principal, Render automáticamente desplegará la nueva versión. Puedes desactivar esto en **"Settings"** → **"Auto-Deploy"**.

---

¿Necesitas ayuda con algo más?