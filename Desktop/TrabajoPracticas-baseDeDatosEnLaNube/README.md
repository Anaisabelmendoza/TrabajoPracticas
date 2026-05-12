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

### 1. Sistema de Autenticación y Registro Multi-Perfil
- **Roles de Acceso:** 
  - **Cliente (`ROLE_USER`):** Registro público estándar.
  - **Agente (`ROLE_AGENT`):** Requiere un código de validación especial.
  - **Administrador (`ROLE_ADMIN`):** Jerarquía superior con visión panorámica del sistema.
- **Seguridad:** Encriptación de contraseñas mediante hashing (OWASP compatible).
- **Recuperación:** Flujo de recuperación en 3 pasos (email → código temporal → nueva contraseña).

### 2. Gestión de Tickets e Incidencias
- **Creación y Edición:** Los clientes pueden abrir modificar sus propias incidencias (título, descripción, categoría, prioridad).
- **Borrado propio:** Eliminación de tickets segura (en cascada) solo permitida al autor.
- **Seguimiento Ágil:** Visualización de estados (Abierto, En Progreso, Resuelto, Cerrado) con filtros de alta potencia.

### 3. Dashboard Analítico (Administración)
- **Vista Protegida:** Página exclusiva de analíticas resguardada por Guards de navegación.
- **Métricas KPI en tiempo real:**
  - Tarjetas dinámicas (Activos, Críticos Pendientes, Nuevos Sin Asignar y Resueltos totales).
  - Enlaces profundos (*Drill-down*) que redirigen al listado aplicando filtros en cascada al historial de forma automática.
- **Gráficos Interactivos (Chart.js):**
  - **Gráfico Circular:** Distribución general de uso según los estados de los tickets.
  - **Gráfico de Barras:** Rendimiento laboral y carga de tickets asignados por cada empleado del sistema (agentes y admins).
- **Control Visual Responsivo:** Integración elegante para adaptarse sin problemas al modo nocturno y modo diurno.

### 4. Sistema Doctrine Integrado (Backend)
- Endpoint dedicado de estadísticas a alta velocidad.
- Contabilización y filtrado automático de seguridad usando `CurrentUserExtension` y `RoleHierarchy` para acotar la exposición de datos dependiendo de si se accede como cliente, técnico o director. 

### 5. Configuración de Usuario y UX
- **Perfil Personal:** Cambio de contraseñas y alteración de avatares guardados.
- **Doble Tema de Interfaz (Diurno/Nocturno):** Diseño adaptativo robusto usando tokens y variables CSS lógicas para mantener alta legibilidad y jerarquización.
- **UI Moderna:** Botones con *Vibrant Violet gradients* e implementaciones enriquecidas de Angular Material (desplegables, selectores, campos flotantes).

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
2. Configurar el archivo `.env` (`DATABASE_URL`) con tus credenciales de base de MySQL/MariaDB.
3. Generar las claves JWT de seguridad criptográfica:
   ```bash
   php bin/console lexik:jwt:generate-keypair
   ```
4. Ejecutar todas las migraciones para constuir el esquema en tu Base de datos local:
   ```bash
   php bin/console doctrine:migrations:migrate
   ```
5. Iniciar servidor:
   ```bash
   symfony server:start
   ```

### Configurar Frontend (Angular + Ionic)
1. Ir a la carpeta `frontend`:
   ```bash
   cd frontend
   npm install
   ```
2. Ejecutar la aplicación en modo desarrollo:
   ```bash
   ionic serve
   ```

---

## 🔑 Códigos Especiales
- **Registro de Agente:** Para registrarte como trabajador en la pantalla de registro de la app, debes introducir el código: `AGENT2026`.

---

## 📂 Estructura del Proyecto

```
├── src/                    # Backend Symfony
│   ├── Entity/             # Entidades (User, Ticket, Comment, Category, Priority)
│   ├── Controller/         # Controladores Api personalizados
│   ├── Repository/         # Repositorios Doctrine (TicketRepository - lógicas de conteo y KPI)
│   ├── State/              # Proveedores de estado y encripción de UserPasswordHasher
│   ├── Doctrine/           # Extensions (CurrentUserExtension limitando perfiles)
│   └── EventListener/      # Listeners
├── config/                 # Configuración Symfony (security, api_platform, jwt, cors, jerarquías)
├── migrations/             # Migraciones de la BD
├── frontend/               # Aplicación Ionic/Angular
│   └── src/app/
│       ├── components/     # Componentes 
│       ├── pages/          # Páginas (stats, dashboard, tickets, profile, login, register)
│       ├── services/       # Providers principales y consumo de la API PHP
│       └── theme/          # Hojas de estilo generales (Vibrant/Dark logic variables)
└── README.md
```
