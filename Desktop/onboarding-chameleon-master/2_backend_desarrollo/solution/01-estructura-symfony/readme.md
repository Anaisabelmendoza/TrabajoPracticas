# Solución: Estructura inicial de Symfony

En este ejercicio configuramos la autenticación básica para un proyecto Symfony existente en `src/backend` y hacemos público el path `/dashboard`.

---

## **Pasos a realizar**

### 1. Preparación inicial

#### **Si ya tienes el proyecto levantado**
Si el proyecto ya está levantado con `docker-compose up`, entra al contenedor del backend:
```bash
docker exec -it backend-app bash
```

Desde dentro del contenedor, ejecuta los siguientes comandos:
- Instalar dependencias:
```bash
composer install
```
- Instalar el bundle de seguridad:
```bash
composer require symfony/security-bundle
```

Recuerda que la consola que tienes es la que está dentro del contenedor de backend, para volver a tu consola, sencillamente: `exit`
---

#### **Si no tienes el proyecto levantado**
Si no has levantado el proyecto, puedes usar la imagen del backend para ejecutar los pasos necesarios. Desde la raíz del proyecto, ejecuta:

1. **Instalar dependencias:**
```bash
docker run --rm -it -v $(pwd)/src/backend:/app backend-tools composer install
```

2. **Instalar el bundle de seguridad:**
```bash
docker run --rm -it -v $(pwd)/src/backend:/app backend-tools composer require symfony/security-bundle
```

---

### 2. Configuración del bundle de seguridad

Modifica el archivo `config/packages/security.yaml` para configurar la autenticación básica y hacer público el path `/dashboard` usando `PUBLIC_ACCESS`:

```yaml
    access_control:
        - { path: ^/dashboard, roles: PUBLIC_ACCESS }    
```

---

### 3. Crear el controlador para `/dashboard`

Genera un controlador utilizando Symfony CLI o manualmente.

#### **Si tienes acceso al contenedor del backend**
Ejecuta:
```bash
symfony console make:controller DashboardController
```
Verás que has generado dos ficheros: el controlador y la plantilla.

#### **Si usas la imagen de Docker**
Ejecuta:
```bash
docker run --rm -it -v $(pwd)/src/backend:/app backend-tools symfony console make:controller DashboardController
```

#### Código del controlador `src/Controller/DashboardController.php`:
```php
<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class DashboardController extends AbstractController
{
    #[Route('/dashboard', name: 'dashboard', methods: ['GET'])]
    public function index(): Response
    {
        return $this->render('dashboard/index.html.twig', [
            'controller_name' => 'DashboardController',
        ]);
    }
}
```

---

### 4. Verificar el acceso público

Levanta el proyecto con `docker-compose up` o verifica que el servidor está en ejecución. Luego accede a:
```
http://localhost:8000/dashboard
```

Deberías ver la página generada por el controlador `DashboardController`.

---

## **Notas finales**

- Symfony utiliza `PUBLIC_ACCESS` como estándar para definir rutas públicas en configuraciones modernas. Esto reemplaza `IS_AUTHENTICATED_ANONYMOUSLY` en versiones anteriores.
- Asegúrate de que las dependencias estén actualizadas ejecutando `composer update` si encuentras algún problema.

---

¡Buen trabajo! 🎉
