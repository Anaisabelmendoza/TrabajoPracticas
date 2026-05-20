# 💻 HelpDesk Pro - Sistema Integral de Gestión de Tickets

Este es un sistema completo de gestión de incidencias y soporte técnico (**HelpDesk**) diseñado para entornos empresariales. El proyecto consta de una arquitectura desacoplada con un backend robusto en **Symfony** y un cliente de alto rendimiento y rica estética en **Ionic/Angular**.

Está conectado a una base de datos relacional gestionada en la nube (**Aiven Cloud SQL**) y cuenta con integraciones de correo electrónico en tiempo real tanto para la recepción de incidencias (**IMAP**) como para notificaciones automáticas (**SMTP**).

---

## 🚀 Stack Tecnológico

### Backend (Symfony + API Platform)
- **Framework:** Symfony 8.0 (PHP >= 8.2)
- **API Engine:** API Platform 4.2 (Arquitectura REST semántica con JSON-LD)
- **Capa de Datos:** Doctrine ORM para mapeo entidad-relación de alta eficiencia.
- **Autenticación:** Seguridad basada en tokens **JWT** stateless (`LexikJWTAuthenticationBundle`).
- **Seguridad Dinámica:** Jerarquía de roles (`RoleHierarchy`) y restricciones por consulta (`CurrentUserExtension`).
- **Gestión de Correo:** `Symfony Mailer` (integrado con protocolo seguro de Gmail) y librerías de lectura IMAP.

### Frontend (Ionic + Angular)
- **Framework:** Ionic 8 + Angular 20 (Arquitectura Single Page Application)
- **UI Components:** Angular Material 20 y componentes nativos de Ionic.
- **Gráficos:** `Chart.js` para visualización analítica en tiempo real.
- **Estilos:** Vanilla CSS / SCSS bajo un diseño moderno de alta gama en tonos púrpuras y degradados morados elegantes, con diseño responsivo multidispositivo.

---

## ✨ Funcionalidades Clave del Sistema

El sistema implementa flujos de trabajo detallados para tres perfiles de usuario distintos: **Clientes**, **Agentes de Soporte** y **Administradores**.

### 1. Gestión Avanzada de Tickets (Kanban Premium)
- **Tablero Kanban de Flujo Horizontal:** Diseñado con un sistema horizontal flexible (`overflow-x: auto;`) que evita que las columnas se desordenen o se apilen verticalmente en pantallas medianas o portátiles.
- **4 Estados de Trabajo:** 
  1. 🔴 **Nuevas:** Incidencias abiertas esperando asignación.
  2. 🟠 **En Proceso:** Tareas en desarrollo y asignadas a un técnico.
  3. 🟢 **Resueltas:** Incidencias solucionadas listas para revisión.
  4. ⚫ **Cerradas (Archivadas):** Tickets cerrados definitivamente para archivo histórico.
- **Identificación Rápida:** Visualización de prioridades con etiquetas y barras de color (Baja 🟢, Media 🟠, Alta 🔴, Crítica 🟤).
- **Detalle de Incidencia:** Historial de comentarios interactivo, detalles técnicos, y generación automática de la ficha técnica.

### 2. Automatización e Integración de Correo (Gmail API)
- **Sincronización IMAP Automática:** Un proceso en segundo plano en el frontend sincroniza la bandeja de entrada del correo del soporte cada 2 minutos (exclusivo para administradores conectados).
- **Sincronización Manual "1-Click":** Botón interactivo en el panel de control del administrador que sincroniza de forma inmediata la bandeja de entrada, mostrando animaciones de carga en tiempo real.
- **Creación Automática:** Los correos recibidos se convierten automáticamente en tickets con el tag visual de origen `[ORIGEN: EMAIL]` y un icono representativo de sobre en su tarjeta Kanban.
- **Auto-Respuestas SMTP (Symfony Mailer):** En el momento en que se genera un ticket (ya sea manualmente o vía email), el sistema envía una confirmación formal y profesional de recepción al correo del cliente de manera automática, incluyendo el ID del ticket y su título.

### 3. Métricas Avanzadas y Gráficos Interactivos (Chart.js)
- **Dashboard Analítico:** Exclusivo para administradores, protegido por Guards de Angular y visualizado en `/stats`.
- **Métricas KPI Dinámicas:** Con tarjetas interactivas de estadísticas rápidas (Tickets Activos, Críticos, Nuevos Sin Asignar y Resueltos Totales).
- **Filtros Profundos (Drill-down):** Al hacer clic sobre cualquier métrica o tarjeta, la aplicación redirige al listado general de tickets aplicando los filtros correspondientes de forma automática.
- **Gráficos en Tiempo Real:**
  - **Distribución de Estado:** Gráfico de donut que ilustra de forma interactiva la carga actual del sistema según los estados del Kanban.
  - **Carga Diaria por Técnico:** Gráfico de barras acumulativas que muestra cuántas tareas tiene asignadas cada agente técnico y en qué fechas.

### 4. Panel de Control del Administrador (`/admin-control`)
- **Gestión y Control de Acceso de Usuarios:**
  - Habilitar o deshabilitar el acceso activo de usuarios mediante Slide Toggles dinámicos.
  - Toggles para controlar la disponibilidad del agente: ponerlos "De Turno" o de "Vacaciones" (afectando la asignación automática de incidencias).
  - Badge dinámico "En línea" / "Desconectado" alimentado por un sistema de **ping activo** cada 1 minuto de inactividad.
- **Asignación Dinámica de Áreas de Trabajo:** Menú emergente personalizado que permite al administrador seleccionar y modificar al instante las categorías técnicas (Redes, Hardware, Accesos...) que cada agente tiene permitidas resolver.
- **CRUD de Configuración Técnica (`/config`):**
  - Añadir y eliminar prioridades de forma dinámica.
  - Añadir, editar y eliminar categorías de averías al instante.

### 5. Control de Rendimiento e Informes Mensuales (PDF)
- **Cuadrícula Mensual de Horas:** Matriz interactiva en el panel de informes que despliega las horas trabajadas por cada agente técnico día por día en el mes seleccionado.
- **Historial y Gráficos Individuales de Agente:** Al hacer clic en un agente en la lista de gestión de usuarios, se despliega un gráfico de Chart.js personalizado (`agentMetricsCanvas`) que desglosa su rendimiento e histórico de actividad laboral.
- **Exportación en PDF:** Botón para generar y descargar informes detallados del rendimiento mensual de cada técnico para fines de auditoría.

### 6. Historial de Trabajos y Copias de Seguridad
- **Archivo Histórico por Cliente (`/pdf-archive`):** 
  - **Tickets Activos:** Visualización interactiva y ordenada de las incidencias resueltas o cerradas agrupadas por cada cliente. Permite ver el reporte y el informe técnico detallado.
  - **Copias de Seguridad (PDF):** Repositorio que almacena los reportes estáticos en PDF generados para incidencias eliminadas definitivamente de la base de datos de producción, garantizando cero pérdida de información histórica.

### 7. Seguridad y Gestión de Perfil
- **Acceso Multi-Perfil:** Restricción estricta de rutas y pantallas basada en JWT. Los usuarios estándar no pueden acceder al panel de control ni a las estadísticas globales.
- **Código de Registro Especial:** Los registros del nuevo personal técnico en la plataforma requieren obligatoriamente la clave de seguridad del soporte: `AGENT2026`.
- **Recuperación de Contraseña en 3 Pasos:**
  1. Solicitud enviando el email para recibir un token de validación único de seguridad.
  2. Introducción y verificación en pantalla del código de seguridad de 6 dígitos.
  3. Cambio seguro y encriptado de la contraseña a una nueva credencial.
- **Perfil de Usuario:** Permite modificar la información personal, cambiar la contraseña de acceso en caliente y cargar/actualizar la foto de perfil en tiempo real.
- **Logotipo Interactivo:** Al hacer clic sobre el logotipo **HELPDESK** en la cabecera superior desde cualquier pantalla interna, la aplicación redirige de forma fluida e instantánea al inicio (`/dashboard`).
- **Forzado de Modo Claro:** El diseño de la interfaz ha sido optimizado con gradientes HSL y colores claros muy cuidados para asegurar la elegibilidad permanente, eliminando interferencias con las configuraciones oscuras por defecto del sistema operativo del cliente.

---

## 📂 Estructura del Proyecto

```
TrabajoPracticas/
├── src/                    # Backend Symfony 8.0
│   ├── Entity/             # Entidades de base de datos (User, Ticket, Comment, Category, Priority)
│   ├── Controller/         # Controladores personalizados de API y endpoints especiales
│   ├── Repository/         # Repositorios Doctrine (TicketRepository - lógicas de KPIs, informes)
│   ├── State/              # State Processors de API Platform (Password hashing, auto-asignación)
│   ├── Doctrine/           # Extensiones Doctrine (Filtros automáticos de visibilidad por rol)
│   └── Kernel.php          # Inicialización del Kernel de Symfony
├── config/                 # Configuración general (Seguridad, mailer, JWT, CORS, Routing)
├── migrations/             # Archivos de migración de la base de datos
├── frontend/               # Cliente Ionic 8 / Angular 20
│   └── src/app/
│       ├── components/     # Componentes compartidos y modales (Login, etc.)
│       ├── pages/          # Pantallas principales (Dashboard, Tickets, Profile, Stats, Config, PDF)
│       ├── services/       # Servicios de Angular (Auth, Theme, Ticket, User, Push Notifications)
│       └── global.scss     # Estilos y variables de diseño CSS globales
├── reset_password.php      # Script rápido de administración para reseteo masivo de credenciales
└── README.md               # Este archivo de documentación
```

---

## 🛠️ Instalación y Configuración Local

### Requisitos Previos
- PHP >= 8.2 y Composer instalado.
- Node.js (v18 o v20 recomendados) y npm.
- Symfony CLI configurado globalmente.

### 1. Configuración del Servidor Backend (Symfony)
1. Instalar las dependencias de PHP y librerías externas:
   ```bash
   composer install
   ```
2. Configurar las variables del archivo `.env` en la raíz del proyecto. Asegúrate de definir las credenciales para la base de datos de Aiven y el DSN del mailer:
   ```env
   DATABASE_URL="mysql://avnadmin:[CONTRASEÑA]@[HOST]:[PUERTO]/defaultdb?serverVersion=8.0.45"
   MAILER_DSN="gmail://[USUARIO_GMAIL]:[CONTRASEÑA_APP]@default"
   ```
3. Generar las claves criptográficas para el firmado de tokens JWT:
   ```bash
   php bin/console lexik:jwt:generate-keypair
   ```
4. Ejecutar las migraciones de la base de datos en caso de ser necesario (para sincronizar tablas en local o en la nube):
   ```bash
   php bin/console doctrine:migrations:migrate
   ```
5. Iniciar el servidor de desarrollo local de Symfony en el puerto por defecto:
   ```bash
   symfony server:start -d
   ```

### 2. Configuración del Cliente Frontend (Ionic/Angular)
1. Navegar al directorio del frontend:
   ```bash
   cd frontend
   ```
2. Instalar las dependencias de Node.js:
   ```bash
   npm install
   ```
3. Iniciar el servidor local de Ionic en modo desarrollo (se levantará en `http://localhost:4200`):
   ```bash
   npm run dev
   ```

---

## 🔑 Credenciales por Defecto de Pruebas

Para agilizar las verificaciones del sistema en entornos de desarrollo local o pruebas remotas, se han configurado los siguientes usuarios de pruebas en la base de datos de producción con roles predefinidos:

* **Contraseña de Registro para Agentes (Técnicos):** `AGENT2026`

* **Usuario de Prueba 1 (Diego - Administrador):**
  - **Correo:** `diego@gmail.com`
  - **Contraseña:** `A123456a!`

* **Usuario de Prueba 2 (María - Agente / Técnico):**
  - **Correo:** `maria@gmail.com`
  - **Contraseña:** `A123456a!`
