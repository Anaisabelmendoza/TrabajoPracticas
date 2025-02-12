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