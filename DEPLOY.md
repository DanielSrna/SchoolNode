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
| `APP_URL` | `https://tu-servicio.onrender.com` | Tu URL de Render |

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

## 8. Configurar Stripe Webhooks (opcional)

Si quieres que Stripe funcione en producción:

1. Ve a [dashboard.stripe.com](https://dashboard.stripe.com/test/webhooks)
2. Click en **"Add endpoint"**
3. URL: `https://tu-servicio.onrender.com/api/pagos/webhook/stripe`
4. Eventos: `checkout.session.completed`
5. Copia el **"Signing secret"** y agrégalo como variable de entorno `STRIPE_WEBHOOK_SECRET`

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