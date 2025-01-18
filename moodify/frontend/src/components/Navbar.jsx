// Navbar.jsx
import React from 'react';
import { Navbar, NavbarContent, NavbarBrand } from '@nextui-org/react';
import { NextUILogo } from "../../public/logo";

export default function NavbarComponent() {
  return (
    <Navbar
      isBordered
      variant="sticky"
      css={{
        background: 'black',
        borderBottom: '2px solid red',
        height: '60px',
        padding: '0 16px',
        width: '100%',
        margin: 0,
        boxSizing: 'border-box',
      }}
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand>
          <div className="navbar-brand">
            <NextUILogo width={40} height={40} />
            <p>Moodify</p>
          </div>
        </NavbarBrand>
      </NavbarContent>
    </Navbar>
  );
}