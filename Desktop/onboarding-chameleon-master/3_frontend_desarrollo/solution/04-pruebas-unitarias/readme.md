# Solución 3.4 - Pruebas unitarias con Jest y React Testing Library

Partiendo de la rama `feature/3-3-conectar-graphql-usuario`, crea una nueva rama `feature/3-4-jest-testing-usuario` y sigue las instrucciones del ejercicio.

## Recuerda :warning:

* Arranca el proyecto con `docker-compose up -d` desde la raíz.
* Ejecuta los comandos dentro del contenedor de frontend: `docker exec -ti frontend-app /bin/bash`
* Si has cambiado de rama y/o hecho cambios en `package.json`: `npm install`.

---
## 1️⃣ Instalar Jest y React Testing Library

Ejecuta el siguiente comando dentro del contenedor del frontend:

```bash
npm install --dev jest @testing-library/react @testing-library/jest-dom babel-jest @babel/preset-env @babel/preset-react @babel/preset-typescript jest-environment-jsdom
```

---
## 2️⃣ Configurar Jest

Crea el archivo `jest.config.js` en la raíz del proyecto con la siguiente configuración:

```js
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": "babel-jest",
  },
};
```

Luego, crea el archivo `jest.setup.js` para configurar Jest:

```js
require("@testing-library/jest-dom");
```

Crea el archivo `.babelrc` en la raíz del proyecto con la siguiente configuración:

```json
{
  "presets": ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"]
}
```

Añade el siguiente script en `package.json` para ejecutar las pruebas:

```json
"scripts": {
  "test": "jest"
}
```

---
## 3️⃣ Configuración de TypeScript para Jest

Asegúrate de que `tsconfig.json` incluye lo siguiente:

```json
{
  "compilerOptions": {
    "types": ["jest", "node", "@testing-library/jest-dom"]
  }
}
```

Esto permitirá que TypeScript reconozca correctamente los matchers de `jest-dom`, como `toBeInTheDocument()`.

---
## 4️⃣ Crear una prueba unitaria para el Header

Crea el archivo `__tests__/Header.test.tsx` y añade la prueba para verificar que los enlaces de navegación aparecen correctamente:

```tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "../components/Header";

test("debe renderizar los enlaces de navegación", () => {
  render(<Header />);
  expect(screen.getByText("Inicio")).toBeInTheDocument();
  expect(screen.getByText("Acerca")).toBeInTheDocument();
  expect(screen.getByText("Contacto")).toBeInTheDocument();
});
```

---
## 5️⃣ Crear una prueba unitaria para el Footer

Crea el archivo `__tests__/Footer.test.tsx` y añade la prueba:

```tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import Footer from "../components/Footer";

test("debe mostrar los enlaces de redes sociales", () => {
  render(<Footer />);
  expect(screen.getByText("Facebook")).toBeInTheDocument();
  expect(screen.getByText("Twitter")).toBeInTheDocument();
  expect(screen.getByText("LinkedIn")).toBeInTheDocument();
});
```

---
## 📌 Notas Adicionales y Referencias

### 🔹 Configuración y Solución de Problemas

- **React no definido en los tests**: Asegúrate de **importar React** en los archivos de prueba y en los componentes (`Header.tsx`, `Footer.tsx`, etc.).
  - Solución: `import React from "react";`
- **Jest no reconoce JSX**: Asegúrate de que **`babel-jest`** está instalado y configurado en `.babelrc`.
- **Jest no tiene `jest-environment-jsdom`**: Instalarlo con `npm install --dev jest-environment-jsdom`.
- **Errores de importación en Jest**: Usa `moduleNameMapper` en `jest.config.js` para resolver módulos correctamente.
- **Errores con `toBeInTheDocument()`**: Asegúrate de que `tsconfig.json` tiene `"types": ["jest", "node", "@testing-library/jest-dom"]`.


### 📌 Nota Adicional: Ignorar Babel en Next.js para evitar conflictos
En Next.js, el compilador por defecto es SWC, pero al instalar Babel para las pruebas unitarias con Jest, pueden surgir conflictos con la configuración de Next.js. En algunos casos, al iniciar el frontend, aparece el error:

```typescript
TypeError: The "path" argument must be of type string. Received undefined
```

Este problema suele estar relacionado con Babel y el loader de fuentes de Next.js. Para evitarlo, se recomienda forzar a Next.js a usar SWC en lugar de Babel.

#### ✅ Solución
Edita next.config.js en src/frontend y añade la siguiente configuración:

```js
module.exports = {
  experimental: {
    forceSwcTransforms: true, // 👈 Fuerza a Next.js a usar SWC en lugar de Babel
  },
};
```

🔹 ¿Por qué hacemos esto?

✅ Next.js ya usa SWC por defecto, por lo que no es necesario Babel en el runtime.
✅ Solo Jest necesita Babel, y con esta configuración, Next.js lo ignora al ejecutar la app.
✅ Evita conflictos como el mensaje "Babel font-loader conflict", que aparece en el log de Next.js.

Después de este cambio, reinicia el frontend con:

```bash
docker-compose restart frontend
```

Este ajuste es experimental, pero para este proyecto no debería causar problemas. Si en futuras versiones de Next.js hay una solución oficial, se podrá revisar. 🚀

### 🔹 Referencias

- [Jest](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Babel para Jest](https://babeljs.io/docs/en/babel-jest)
- [Configuración de Jest con TypeScript](https://kulshekhar.github.io/ts-jest/)

### Cómo ejecutar las pruebas

Ejecuta todas las pruebas con:

```bash
npm test
```

Para ejecutar las pruebas en modo watch:

```bash
npm test -- --watch
```

:tada: ¡Listo! Ahora puedes validar el correcto funcionamiento de los componentes con Jest y React Testing Library.