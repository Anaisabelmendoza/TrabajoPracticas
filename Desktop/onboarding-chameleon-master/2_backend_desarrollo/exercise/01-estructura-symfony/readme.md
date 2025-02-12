# Ejercicio 1: Estructura inicial del proyecto Symfony

> Partiendo de la rama `solution/1_configuracion_inicial`, con el bloque 1 ya completado, crea una rama `feature/2-1-estructura-symfony-usuario` y realiza los pasos que te indica el ejercicio.

En este ejercicio aprenderás a configurar y estructurar un proyecto Symfony con autenticación básica.


---

## **Objetivos**

1. Configurar un nuevo proyecto Symfony.
2. Implementar un sistema de autenticación básico.
3. Configurar las rutas iniciales.

---

## **Instrucciones**

1. Instala Symfony CLI y crea un nuevo proyecto:
```bash
symfony new backend --webapp
```

2. Configura la autenticación básica:
   - Instala el bundle de seguridad:
   ```bash
   composer require symfony/security-bundle
   ```
   - Configura el acceso a rutas protegidas en `security.yaml`.

3. Crea una ruta inicial protegida:
   - Añade una ruta `/dashboard` en `routes.yaml`.

---

## **Recursos Adicionales**

- [Documentación de Symfony CLI](https://symfony.com/doc/current/setup.html)
- [Guía de autenticación básica](https://symfony.com/doc/current/security.html)

---

¡Buena suerte!
