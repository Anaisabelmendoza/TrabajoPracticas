# Solución 3.5 - Pruebas E2E con Cypress

Partiendo de la rama `feature/3-4-jest-testing-usuario`, crea una nueva rama `feature/3-5-cypress-e2e-usuario` y sigue las instrucciones del ejercicio.

## Recuerda :warning:

* Antes de comenzar, **para todos los contenedores en ejecución** con:

  ```bash
  docker-compose down
  ```

* Si **no te sientes cómodo con Docker**, **lee la solución sin intentar reproducirla desde cero**. 
* Si ya te descargaste la solución, **puedes saltarte los pasos de creación de carpetas y archivos**.

---
## 1️⃣ Inicialización del entorno de pruebas E2E

### 📌 Si **NO** tienes la solución descargada:

Ejecuta los siguientes comandos para preparar el entorno de pruebas:

```bash
mkdir -p src/e2e
cd src/e2e
```

Inicializa un `package.json` separado para evitar conflictos de dependencias:

```bash
docker run -it --rm -v $PWD/src/e2e:/e2e -w /e2e frontend-tools npm init -y
```

Instala Cypress:

```bash
docker run -it --rm -v $PWD/src/e2e:/e2e -w /e2e frontend-tools npm install --save-dev cypress
```

Crea el archivo `cypress.config.ts` dentro de `src/e2e/` con el siguiente contenido:

```ts
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://frontend:3000", // Se usará el nombre del servicio en Docker
    supportFile: false,
  },
});
```

Crea el archivo `tsconfig.json` en `src/e2e/` con:

```json
{
  "extends": "../frontend/tsconfig.json",
  "compilerOptions": {
    "types": ["cypress"]
  },
  "include": ["cypress/**/*.ts"]
}
```

---
## 2️⃣ Modificar `docker-compose.yml` (Solo si NO tienes la solución descargada)

Añade el siguiente servicio antes de la sección de volúmenes en `docker-compose.yml`:

```yaml
  cypress:
    image: cypress/included:14.0.1
    depends_on:
      - frontend
    working_dir: /e2e
    volumes:
      - ./src/e2e:/e2e
      - ./src/frontend:/frontend
    command: ["cypress", "run", "--config-file", "cypress.config.ts"]
```

---
## 3️⃣ Crear pruebas E2E para Header y Footer

Crea el archivo `cypress/e2e/header.cy.ts` para probar la navegación en el **Header**:

```ts
/// <reference types="cypress" />

describe("Navegación en el Header", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("Verifica que los enlaces de navegación aparecen correctamente", () => {
    cy.contains("Inicio").should("be.visible");
    cy.contains("Acerca").should("be.visible");
    cy.contains("Contacto").should("be.visible");
  });
});
```

Crea el archivo `cypress/e2e/footer.cy.ts` para probar los enlaces en el **Footer**:

```ts
/// <reference types="cypress" />

describe("Verificación de enlaces en el Footer", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("Verifica que los enlaces de redes sociales están presentes", () => {
    cy.contains("Facebook").should("be.visible");
    cy.contains("Twitter").should("be.visible");
    cy.contains("LinkedIn").should("be.visible");
  });
});
```

---
## 4️⃣ Ejecutar pruebas E2E con Docker

Si ya tienes todo configurado, ejecuta los contenedores con:

```bash
docker-compose up --build
```

Para ejecutar Cypress en modo **headless**, usa:

```bash
docker-compose run cypress cypress run
```

Para abrir Cypress en modo interactivo en Docker, usa:

```bash
docker-compose run cypress cypress open
```

---
## 📌 Notas Adicionales y Referencias

### 🔹 Configuración y Solución de Problemas

- **Antes de iniciar este ejercicio, asegúrate de parar todos los contenedores con `docker-compose down`**.
- **Si ya descargaste la solución, puedes saltarte la creación de carpetas y archivos, así como la modificación de `docker-compose.yml`.**
- **Si Cypress no encuentra el servidor en `localhost`, usa `http://frontend:3000` en `cypress.config.ts`.**
- **Si Cypress no detecta archivos TypeScript, revisa `tsconfig.json` en `src/e2e` y asegúrate de incluir `"include": ["cypress/**/*.ts"]`.**

### 🔹 Referencias

- [Cypress](https://www.cypress.io/)
- [Guía de configuración](https://docs.cypress.io/guides/overview/why-cypress)

🎉 ¡Listo! Ahora puedes validar la navegación y funcionalidad del frontend con pruebas E2E en Cypress.
