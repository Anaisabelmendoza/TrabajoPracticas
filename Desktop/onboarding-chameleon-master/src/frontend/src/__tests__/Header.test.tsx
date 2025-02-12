import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "../components/Header";

test("debe renderizar los enlaces de navegación", () => {
  render(<Header />);
  expect(screen.getByText("Inicio")).toBeInTheDocument();
  expect(screen.getByText("Acerca")).toBeInTheDocument();
  expect(screen.getByText("Contacto")).toBeInTheDocument();
});