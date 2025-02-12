import React from "react";

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