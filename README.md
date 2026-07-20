# SchoolNode - Prototipo TRL5

Sistema de gestión escolar para automatización de matrículas y control financiero.

## 🚀 Inicio Rápido

### Requisitos previos
- Node.js v20+
- MongoDB Atlas (o MongoDB local)
- Docker (opcional)
- Cuenta de Stripe Developer (para pagos)

### Instalación local

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repo>
   cd SchoolNode
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con tus credenciales:
   - `MONGODB_URI`: Tu conexión de MongoDB Atlas
   - `JWT_SECRET`: Secreto para tokens JWT
   - `STRIPE_SECRET_KEY`: Clave secreta de Stripe (modo test)
   - `STRIPE_PUBLISHABLE_KEY`: Clave pública de Stripe
   - `STRIPE_WEBHOOK_SECRET`: Secreto del webhook de Stripe

4. **Ejecutar seed de datos**
   ```bash
   npm run seed
   ```

5. **Iniciar servidor**
   ```bash
   npm run dev
   ```

6. **Acceder a la aplicación**
   ```
   http://localhost:3000
   ```

### Instalación con Docker

```bash
# Construir y levantar contenedores
docker-compose up -d

# Ejecutar seed
docker-compose exec app npm run seed

# Ver logs
docker-compose logs -f app
```

## 🔑 Credenciales de Prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@schoolnode.com | Admin123! |
| Empleado | empleado1@schoolnode.com | Empleado123! |
| Empleado | empleado2@schoolnode.com | Empleado123! |
| Empleado | empleado3@schoolnode.com | Empleado123! |

## 📊 Características

### ✅ Implementadas
- **Autenticación JWT** con rotación de tokens (15min access, 7 días refresh)
- **Control de acceso por roles** (Admin, Empleado, Estudiante)
- **CRUD completo** de estudiantes, cursos, aulas, empleados y matrículas
- **Integración Stripe** para pagos en línea (modo test)
- **Pagos físicos** registrados manualmente
- **Semaforización** de matrículas por fecha de vencimiento
- **Control de capacidad** de aulas con migración de estudiantes
- **Logger Winston** con 3 niveles (proceso, éxito, error)
- **Paginación y búsqueda** por cédula en listado de estudiantes
- **Datos de prueba** (20 estudiantes, 4 cursos, 4 aulas, 15 matrículas)

### 🔧 Stack Tecnológico
- **Backend:** Node.js + Express.js
- **Base de datos:** MongoDB + Mongoose
- **Frontend:** EJS + Bootstrap 5
- **Seguridad:** JWT + bcryptjs
- **Pagos:** Stripe API
- **Contenedores:** Docker + Docker Compose
- **Logger:** Winston

## 📁 Estructura del Proyecto

```
SchoolNode/
├── src/
│   ├── config/         # Configuraciones (DB, JWT, Stripe)
│   ├── controllers/    # Lógica de controladores
│   ├── models/         # Modelos Mongoose
│   ├── routes/         # Rutas Express
│   ├── middleware/     # Auth, RBAC
│   ├── views/          # Plantillas EJS
│   ├── public/         # CSS, JS, imágenes
│   ├── seeds/          # Script de seed
│   └── utils/          # Logger y helpers
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md
```

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Cerrar sesión

### Empleados (solo admin)
- `GET /api/empleados` - Listar empleados
- `GET /api/empleados/:id` - Ver empleado
- `POST /api/empleados` - Crear empleado
- `PUT /api/empleados/:id` - Actualizar empleado
- `DELETE /api/empleados/:id` - Eliminar empleado

### Cursos
- `GET /api/cursos` - Listar cursos
- `GET /api/cursos/:id` - Ver curso
- `POST /api/cursos` - Crear curso
- `PUT /api/cursos/:id` - Actualizar curso
- `DELETE /api/cursos/:id` - Eliminar curso

### Aulas
- `GET /api/aulas` - Listar aulas (con población actual)
- `GET /api/aulas/:id` - Ver aula
- `POST /api/aulas` - Crear aula
- `PUT /api/aulas/:id` - Actualizar aula
- `DELETE /api/aulas/:id` - Eliminar aula

### Estudiantes
- `GET /api/estudiantes` - Listar (con paginación y búsqueda)
- `GET /api/estudiantes/:id` - Ver estudiante
- `POST /api/estudiantes` - Crear estudiante
- `PUT /api/estudiantes/:id` - Actualizar estudiante
- `DELETE /api/estudiantes/:id` - Eliminar estudiante

### Matrículas
- `GET /api/matriculas` - Listar matrículas
- `GET /api/matriculas/:id` - Ver matrícula
- `POST /api/matriculas` - Crear matrícula
- `PUT /api/matriculas/:id` - Actualizar estado
- `DELETE /api/matriculas/:id` - Cancelar matrícula
- `POST /api/matriculas/migrar` - Migrar estudiante de aula

### Pagos
- `POST /api/pagos/crear-sesion` - Crear sesión de Stripe
- `POST /api/pagos/fisico` - Registrar pago físico
- `POST /api/webhooks/stripe` - Webhook de Stripe

## 💳 Configuración de Stripe

1. Crear cuenta en [Stripe Dashboard](https://dashboard.stripe.com/test)
2. Obtener claves API en Developers > API keys
3. Configurar webhook:
   - URL: `https://tu-dominio.com/api/pagos/webhook/stripe`
   - Eventos: `checkout.session.completed`
4. Copiar webhook secret al `.env`

##  Datos de Prueba

El seed crea:
- 1 administrador
- 3 empleados
- 4 cursos (Conducción Básica, Avanzada, Mantenimiento, Seguridad Vial)
- 4 aulas (capacidad 10-15)
- 20 estudiantes con datos ficticios
- 15 matrículas con diferentes estados de pago

## 📝 Scripts Disponibles

```bash
npm run dev          # Desarrollo con nodemon
npm start            # Producción
npm run seed         # Ejecutar seed de datos
npm run docker:up    # Levantar contenedores
npm run docker:down  # Detener contenedores
npm run docker:logs  # Ver logs de contenedores
```

##  Seguridad

- Contraseñas hasheadas con bcryptjs
- Tokens JWT con rotación automática
- Control de acceso basado en roles (RBAC)
- Validación de datos con express-validator
- Webhook de Stripe verificado con firma

## 📄 Licencia

MIT License

## 👥 Autores

- Daniel Felipe Serna López
- Danny Alejandro Velasco Patiño
- Idelgar Diaz Narvaez

## 🎓 Universidad

Universidad Nacional Abierta y a Distancia UNAD  
Ingeniería de Sistemas - 2026
