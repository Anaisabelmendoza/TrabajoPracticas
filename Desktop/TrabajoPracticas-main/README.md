# Helpdesk Ticketing System - Proyecto de Prácticas

Este es un sistema de gestión de tickets (Helpdesk) completo, desarrollado con un backend en **Symfony** y un frontend multiplataforma en **Ionic/Angular**.

## 🚀 Tecnologías Utilizadas

### Backend
- **Framework:** Symfony 8.0
- **API:** API Platform 4.2 (Arquitectura REST)
- **Seguridad:** Autenticación vía JWT (LexikJWTAuthenticationBundle)
- **Base de Datos:** MySQL/MariaDB con Doctrine ORM
- **CORS:** NelmioCorsBundle configurado para comunicación con el frontend

### Frontend
- **Framework:** Ionic 8 + Angular 20
- **UI Components:** Angular Material 20 + Ionic Components
- **Estilos:** SCSS con diseño personalizado (Vibrant Violet / Modern Dark Mode)
- **Estado/Auth:** AuthService con gestión de tokens JWT y persistencia de sesión

---

## ✨ Características Principales

### 1. Sistema de Autenticación y Registro
- **Doble Perfil de Registro:**
  - **Cliente (ROLE_USER):** Registro público estándar.
  - **Agente (ROLE_AGENT):** Requiere un código de validación especial (**`AGENT2026`**) para ser asignado como trabajador.
- **Seguridad:** Encriptación de contraseñas mediante hashing y validaciones complejas (Mayúsculas, números, símbolos).
- **Recuperar contraseña:** Flujo de recuperación en 3 pasos (email → código → nueva contraseña).

### 2. Gestión de Tickets
- **Creación de Tickets:** Los clientes pueden abrir incidencias con título, descripción, categoría y prioridad.
- **Seguimiento:** Historial de cambios y visualización de estados (Abierto, En Progreso, Resuelto, Cerrado).
- **Categorías y Prioridades:** Clasificación dinámica de las incidencias.

### 3. Comentarios y Comunicación
- Sistema de comentarios en cada ticket para la interacción entre clientes y agentes.
- Atribución automática del autor del comentario.

### 4. Perfil de Usuario
- **Avatar personalizable:** Subida de foto de perfil guardada en localStorage.
- **Cambiar Contraseña:** Formulario integrado en el perfil con validación (mínimo 8 caracteres, confirmación).
- **Modo Oscuro:** Toggle para alternar entre tema claro y oscuro.
- **Notificaciones:** Toggle para activar/desactivar alertas del sistema.
- **Cerrar Sesión:** Cierre seguro con eliminación del token JWT.

### 5. Diseño y UX
- **Páginas Públicas (Login/Register):** Estética "Vibrant Violet" con degradados modernos y alta visibilidad.
- **Dashboard Interno:** Modo oscuro (Dark Mode) profesional optimizado para la gestión de tickets.
- Los toggles de Modo Oscuro y Notificaciones están claramente separados en filas independientes para evitar solapamientos.

---

## 🛠️ Instalación y Configuración

### Requisitos
- PHP >= 8.2
- Composer
- Node.js & npm
- Symfony CLI

### Clonar y Configurar Backend
1. Instalar dependencias:
   ```bash
   composer install
   ```
2. Configurar el archivo `.env` con tus credenciales de base de datos.
3. Generar las claves JWT:
   ```bash
   php bin/console lexik:jwt:generate-keypair
   ```
4. Ejecutar migraciones:
   ```bash
   php bin/console doctrine:migrations:migrate
   ```
5. Iniciar servidor:
   ```bash
   symfony server:start
   ```

### Configurar Frontend
1. Ir a la carpeta `frontend`:
   ```bash
   cd frontend
   npm install
   ```
2. Ejecutar la aplicación:
   ```bash
   ionic serve
   ```

---

## 🔑 Códigos Especiales
- **Registro de Agente:** Para registrarte como trabajador en la pantalla de registro, debes introducir el código: `AGENT2026`.

---

## 📂 Estructura del Proyecto

```
├── src/                    # Backend Symfony
│   ├── Entity/             # Entidades (User, Ticket, Comment, Category, Priority, etc.)
│   ├── Controller/         # Controladores (AttachmentController, UploadEvidenceAction)
│   ├── Repository/         # Repositorios Doctrine
│   ├── State/              # State Processors (UserPasswordHasherProcessor, CommentOwnerProcessor)
│   ├── Doctrine/           # Extensions (CurrentUserExtension)
│   ├── EventListener/      # Listeners de eventos
│   └── EventSubscriber/    # Subscribers de eventos
├── config/                 # Configuración Symfony (security, api_platform, jwt, cors)
├── migrations/             # Migraciones de la base de datos
├── frontend/               # Aplicación Ionic/Angular
│   └── src/app/
│       ├── components/     # Componentes reutilizables (login)
│       ├── pages/          # Páginas (dashboard, profile, register, tickets, forgot-password)
│       └── services/       # Servicios (auth, theme)
└── README.md
```
