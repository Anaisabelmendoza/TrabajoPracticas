import { Injectable, Renderer2, RendererFactory2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private isDarkMode = false;

  constructor(
    rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    // Cargar preferencia guardada o por defecto light (false)
    const saved = localStorage.getItem('darkMode');
    this.isDarkMode = saved !== null ? saved === 'true' : false;
    
    // Forzar modo claro siempre
    this.isDarkMode = false;
    localStorage.setItem('darkMode', 'false');
    
    this.applyTheme();
  }

  toggleTheme() {
    this.isDarkMode = false;
    localStorage.setItem('darkMode', 'false');
    this.applyTheme();
  }

  applyTheme() {
    // Forzar siempre light-theme en el body y quitar dark-theme
    this.renderer.addClass(this.document.body, 'light-theme');
    this.renderer.removeClass(this.document.body, 'dark-theme');
  }

  getDarkMode() {
    return false;
  }
}
