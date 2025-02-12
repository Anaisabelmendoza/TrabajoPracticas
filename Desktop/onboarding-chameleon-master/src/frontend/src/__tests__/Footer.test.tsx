import React from "react";
import { render, screen } from "@testing-library/react";
import Footer from "../components/Footer";

test("debe mostrar los enlaces de redes sociales", () => {
  render(<Footer />);
  expect(screen.getByText("Facebook")).toBeInTheDocument();
  expect(screen.getByText("Twitter")).toBeInTheDocument();
  expect(screen.getByText("LinkedIn")).toBeInTheDocument();
});