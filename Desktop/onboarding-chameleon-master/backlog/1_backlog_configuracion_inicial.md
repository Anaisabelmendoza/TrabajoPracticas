## Bloque 1: Configuración Inicial

```json
[
  {
    "category": "Configuración inicial",
    "title": "Instalar Docker en los equipos locales",
    "description": "Descargar e instalar Docker Desktop en los equipos. Una vez instalado, abre una terminal y ejecuta el comando `docker run hello-world` para comprobar que Docker está operativo. Si el comando muestra un mensaje de éxito, la instalación se completó correctamente.",
    "estimate": 2,
    "tags": ["infraestructura", "docker"],
    "references": ["https://docs.docker.com/get-docker/"]
  },
  {
    "category": "Configuración inicial",
    "title": "Instalar PHP en el entorno local",
    "description": "Descargar e instalar PHP en el entorno local. Asegúrate de que esté configurado correctamente verificando la versión con `php -v`.",
    "estimate": 1,
    "tags": ["infraestructura", "php"],
    "references": ["https://www.php.net/manual/en/install.php"]
  },
  {
    "category": "Configuración inicial",
    "title": "Instalar Node.js usando NVM",
    "description": "Instalar NVM (Node Version Manager) y utilizarlo para instalar la versión recomendada de Node.js. Verifica la instalación ejecutando `node -v` y `npm -v`.",
    "estimate": 2,
    "tags": ["infraestructura", "node.js", "nvm"],
    "references": ["https://github.com/nvm-sh/nvm"]
  },
  {
    "category": "Configuración inicial",
    "title": "Instalar Visual Studio Code y configurarlo con complementos",
    "description": "Instalar Visual Studio Code como IDE principal. Configurar los complementos esenciales como Docker, PHP, y Prettier. Verifica que los complementos estén activos y funcionando correctamente.",
    "estimate": 2,
    "tags": ["infraestructura", "ide", "vscode"],
    "references": ["https://code.visualstudio.com/"]
  },
  {
    "category": "Configuración inicial",
    "title": "Crear el entorno de desarrollo con Docker Compose",
    "description": "Crear un archivo `docker-compose.yml` que configure los servicios necesarios para el desarrollo del backend y frontend. Asegúrte de incluir configuraciones para PHP, Node.js, Symfony CLI y Next.js CLI.",
    "estimate": 5,
    "tags": ["infraestructura", "docker-compose", "configuración"],
    "references": ["https://docs.docker.com/compose/overview/"]
  }
]
```.
