# Solución 3.1 - Inicialización del Proyecto con Next.js, TypeScript y Tailwind CSS

Partiendo de la rama `solution/1_configuracion_inicial`, con el bloque 1 ya completado, crea una rama `feature/3-1-next-js-usuario` y realiza los pasos que te indica el ejercicio.


## Recuerda :warning:

* Debes arrancar el proyecto con `docker-compose up -d` desde la raíz.
* Los comandos, salvo que se indique lo contrario, se ejecutan dentro de la consola del frontend (`docker exec -ti frontend-app /bin/bash`)
* Si has cambiado de rama y/o hecho cambios en `package.json`: `npm install`.

---
## 1. Crear el proyecto con Next.js y TypeScript

Esto lo debes de traer ya del bloque 1, así que nada que hacer. Recuerda que el comando era algo así como `npx create-next-app@latest frontend --typescript`.

## 2. ️Instalar y configurar Tailwind CSS

También venía ya por defecto configurado al iniciar el proyecto en el bloque 1, así que ya lo habrás solucionado :rocket:

## 3. Configuración de Tailwind CSS

No toques nada, pero revisa la documentación y entiende lo que hacen los ficheros `tailwind.config.js`, `postcss.config.js`... tal vez tengamos que tocar algo más adelante.

## 4. Componente de prueba.

Crea el componente `components/TestComponent.ts`:

```typescript
export default function TestComponent() {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <h1 className="text-3xl font-bold text-blue-600">🚀 Hola CodeArts 🚀</h1>
      </div>
    );
}  
```

## 5. Úsalo en page.tsx

Cambia el contenido de app/page.tsx por:

```typescript
import TestComponent from "../components/TestComponent";

export default function Home() {
  return <TestComponent />;
}
```

## Notas adicionales

Prueba a cambiar el estilo de la página:

* :rainbow: metiendo algo de color.
* :pencil2: cambiando el texto.
* :trophy: algo con lo que sorprender a los demás.

### Referencias 📚
- [Tailwind CSS - Instalación](https://tailwindcss.com/docs/installation)
- [Tailwind CSS - Configuración](https://tailwindcss.com/docs/configuration)
- [PostCSS - Documentación](https://postcss.org/)
- [Next.js con Tailwind CSS](https://nextjs.org/docs/advanced-features/customizing-postcss)

---

:rocket::rocket: Enhorabuena, ya estás preparado para seguir con el diseño :rocket::rocket: