import React from "react";
import "./Navbar.css";
import { useLocation } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";

const NavbarComponent = () => {
  const location = useLocation();
  const curpath = location.pathname;

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="sticky-top">
      <Container>
        <Navbar.Brand href="/">Atelier 2901</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link
              href="/"
              className={curpath === "/" ? "active-link" : ""}
            >
              Home
            </Nav.Link>
            <Nav.Link
              href="/stationery"
              className={curpath === "/stationery" ? "active-link" : ""}
            >
              Bespoke Stationery
            </Nav.Link>
            <Nav.Link
              href="/gifting"
              className={curpath === "/gifting" ? "active-link" : ""}
            >
              Gifting
            </Nav.Link>
            <Nav.Link
              href="/books"
              className={curpath === "/books" ? "active-link" : ""}
            >
              Coffee Table Books
            </Nav.Link>
            <Nav.Link
              href="/invitations"
              className={curpath === "/invitations" ? "active-link" : ""}
            >
              Invitations
            </Nav.Link>
            <Nav.Link
              href="/about"
              className={curpath === "/about" ? "active-link" : ""}
            >
              About
            </Nav.Link>
            <Nav.Link
              href="/contact"
              className={curpath === "/contact" ? "active-link" : ""}
            >
              Contact Us
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;