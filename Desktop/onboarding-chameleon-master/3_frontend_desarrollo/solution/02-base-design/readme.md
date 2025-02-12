# Solución 3.2 - Implementación del Diseño Base con Tailwind CSS

Partiendo de la rama `feature/3-1-next-js-usuario`, crea una nueva rama `feature/3-2-tailwind-layout-usuario` y sigue las instrucciones del ejercicio.

## Recuerda :warning:

* Arranca el proyecto con `docker-compose up -d` desde la raíz.
* Ejecuta los comandos dentro del contenedor de frontend: `docker exec -ti frontend-app /bin/bash`
* Si has cambiado de rama y/o hecho cambios en `package.json`: `npm install`.

---
## 1️⃣ Crear el Header

Crea el componente `components/Header.tsx` con la barra de navegación:

```tsx
export default function Header() {
  return (
    <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">🚀 Mi Aplicación</h1>
      <nav>
        <ul className="flex space-x-4">
          <li><a href="#" className="hover:underline">Inicio</a></li>
          <li><a href="#" className="hover:underline">Acerca</a></li>
          <li><a href="#" className="hover:underline">Contacto</a></li>
        </ul>
      </nav>
    </header>
  );
}
```

---
## 2️⃣ Crear la Sección Hero

Crea el componente `components/Hero.tsx`:

```tsx
export default function Hero() {
  return (
    <section className="text-center py-16 bg-gray-100">
      <h2 className="text-4xl font-bold mb-4">Bienvenido a Mi Aplicación</h2>
      <p className="text-lg mb-6">Explora y descubre nuevas funcionalidades</p>
      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500">Empezar</button>
    </section>
  );
}
```

---
## 3️⃣ Crear el Footer

Crea el componente `components/Footer.tsx` con enlaces a redes sociales:

```tsx
export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white text-center p-4 mt-8">
      <p>© 2025 CodeArts Solutions. Todos los derechos reservados.</p>
      <div className="flex justify-center space-x-4 mt-2">
        <a href="#" className="hover:text-blue-400">Facebook</a>
        <a href="#" className="hover:text-blue-400">Twitter</a>
        <a href="#" className="hover:text-blue-400">LinkedIn</a>
      </div>
    </footer>
  );
}
```

---
## 4️⃣ Integrar los Componentes en `app/layout.tsx`

Modifica `app/layout.tsx` para incluir los nuevos componentes:

```tsx
import Header from "../components/Header";
import Hero from "../components/Hero";
import Footer from "../components/Footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
```

---
## 📌 Notas Adicionales

* Asegúrate de probar el diseño en **dispositivos móviles**. Por ejemplo lo puedes hacer con la consola de Google Chrome, dándole a F12 y cambiando el aspecto
* Usa `npm run dev` para verificar que los estilos de Tailwind se aplican correctamente.

### Referencias 📚
- [Tailwind CSS - Componentes](https://tailwindui.com/components)
- [Tailwind CSS - Flexbox y Grid](https://tailwindcss.com/docs/flexbox-grid)
- [Tailwind CSS - Diseño Responsivo](https://tailwindcss.com/docs/responsive-design)
- [Tailwind CSS - Botones y Tipografía](https://tailwindcss.com/docs/typography-plugin)

:tada: ¡Listo! Has implementado la estructura base con Tailwind CSS.
