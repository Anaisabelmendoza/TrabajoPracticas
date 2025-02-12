# Ejercicio 5: Configurar Docker Compose

En este ejercicio aprenderás a crear un entorno reproducible para backend y frontend utilizando Docker Compose.

---

## **Objetivos**
1. Crear un archivo `docker-compose.yml` para orquestar servicios.
2. Configurar contenedores para backend y frontend.
3. Verificar que los servicios se inicien correctamente.

---

## **Instrucciones**

### 1. Crear el archivo `docker-compose.yml`
Crea un archivo `docker-compose.yml` en tu directorio de trabajo. Incluye configuraciones para:
- **PHP**: Configura un contenedor con la versión necesaria para Symfony CLI.
- **Node.js**: Configura un contenedor con la versión necesaria para Next.js CLI.
- **Nginx**: Configura un servidor web para servir las aplicaciones.

### 2. Iniciar los servicios
Ejecuta el siguiente comando para iniciar los contenedores:
```bash
docker-compose up
```

### 3. Verificar el funcionamiento
- Accede a los logs de los contenedores con `docker-compose logs` para asegurarte de que no haya errores.
- Accede al backend y frontend desde el navegador o herramientas como Postman.

---

## **Recursos Adicionales**
- [Documentación oficial de Docker Compose](https://docs.docker.com/compose/overview/)
- [Ejemplo de configuración para Symfony](https://symfony.com/doc/current/setup/docker.html)
- [Ejemplo de configuración para Next.js](https://nextjs.org/docs/deployment#docker)
- **Notas sobre posibles desafíos con Docker**:
  - **Rendimiento**: Optimiza recursos en Docker Desktop y usa imágenes ligeras.
  - **Configuración de red**: Simplifica usando `docker-compose` y redes predefinidas.
  - **Persistencia de datos**: Usa volúmenes nombrados y documenta su uso.
  - **Depuración**: Usa `docker logs` y herramientas de monitoreo.
  - **Espacio en disco**: Limpia regularmente con `docker system prune`.
  - **Aprendizaje**: Proporciona ejercicios prácticos para nuevos usuarios.

---

¡Buena suerte con este ejercicio!
