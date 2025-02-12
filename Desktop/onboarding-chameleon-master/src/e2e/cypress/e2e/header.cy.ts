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