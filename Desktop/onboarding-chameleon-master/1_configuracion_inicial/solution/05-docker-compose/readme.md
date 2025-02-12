# Soluciones Oficiales

Esta carpeta contiene las soluciones oficiales para los ejercicios del bloque de Configuración Inicial. Aquí también encontrarás comandos para iniciar los proyectos de backend y frontend utilizando Docker.

---

## Acerca de la integración Docker - VS Code

Para el correcto uso de los plugins de VS Code con docker, hay que instalar *docker-desktop*, enlazar con una cuenta de *docker hub* y que la instalación del motor de docker no colisione con estos. 

Esto *no es un requisito indispensable para continuar con el onboarding*, pues en todos los puntos se facilitarán los comandos para el acceso a los contenedores sin el uso de estas herramientas.

Es decir, docker-desktop no es mas que un dashboard sobre el motor de docker y el plugin es una utilidad del IDE que conecta con el mismo.

## **Soluciones de Ejercicios**

1. **Instalar Docker**  
   Verifica la instalación con `docker --version`. Ejecuta `docker run hello-world` para comprobar que Docker funciona correctamente.

2. **Instalar PHP**  
   Confirma la versión instalada con `php -v`.

3. **Instalar Node.js**  
   Verifica la instalación con `node -v` y `npm -v`.

4. **Configurar Visual Studio Code**  
   Asegúrate de que los plugins recomendados están instalados. Consulta [esta guía](https://code.visualstudio.com/docs/getstarted/userinterface) para más detalles.

5. **Docker Compose**  
   Verifica la versión instalada con `docker-compose --version`.

---

## **Preparar y ejecutar los proyectos**

En caso de tener problemas en la configuración del sistema, puedes usar esta guía basada en docker que te ahorrará incompatibilidad de versiones.

### **Backend**

1. Construir la imagen:
```bash
docker build -t backend-tools -f src/backend/Dockerfile src/backend
```

2. Inicializar el backend:
   - Ejecutar `composer install` para instalar dependencias:
```bash
docker run --rm -it -v $(pwd)/src/backend:/app backend-tools composer install
```

   - Iniciar el servidor del backend:
```bash
docker run --rm -it -v $(pwd)/src/backend:/app -p 8000:8000 backend-tools
```

3. Probar el backend:
   - Accede a `http://localhost:8000` para confirmar que está en funcionamiento.

---

### **Frontend**

1. Construir la imagen:
```bash
docker build -t frontend-tools -f src/frontend/Dockerfile src/frontend
```

2. Inicializar el proyecto Next.js:
   - Crear una aplicación Next.js con soporte para TypeScript:
```bash
docker run --rm -it -v $(pwd)/src/frontend:/app frontend-tools npx create-next-app@latest . --typescript
```

   - Instalar dependencias si es necesario:
```bash
docker run --rm -it -v $(pwd)/src/frontend:/app frontend-tools npm install
```

3. Iniciar el servidor del frontend:
```bash
docker run --rm -it -v $(pwd)/src/frontend:/app -p 3000:3000 frontend-tools
```

4. Probar el frontend:
   - Accede a `http://localhost:3000` para confirmar que está en funcionamiento.

---

## **Nota Importante**

- Los comandos y configuraciones aquí presentados permiten arrancar los proyectos de manera limpia. Los alumnos pueden modificarlos según sea necesario para adaptarse a su entorno.
- Estos pasos están diseñados para reforzar los conceptos de configuración inicial y proporcionar un entorno listo para el desarrollo.
- De cualquier forma, ya tienes la salida preparada en cada carpeta correspondiente por si atrancas.

---

¡Buena suerte y a explorar! 🎉
