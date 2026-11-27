"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Icon } from "./ui-icon";

export function SiteHeader() {
  const menu = useRef<HTMLDetailsElement>(null);
  const closeMenu = () => menu.current?.removeAttribute("open");

  return <header className="site-header">
    <Link className="brand" href="/" aria-label="Mindsupport home" onClick={closeMenu}><Image src="/mindsupport-logo.png" alt="mindsupport" width={600} height={200} priority /></Link>
    <nav className="desktop-nav" aria-label="Main navigation"><Link href="/#approach">Our approach</Link><Link href="/#support">How we can help</Link><Link href="/reflections">Reflections</Link><Link href="/#contact">Contact</Link><Link href="/sessions">Book a session</Link></nav>
    <div className="header-actions"><Link className="header-cta header-cta-outline" href="/say"><Icon name="message" size={17}/> Anonymous Message</Link><Link className="header-cta" href="/book">Book a free call</Link></div>
    <details className="mobile-menu" ref={menu}><summary aria-label="Open navigation"><span></span><span></span><span></span></summary><nav aria-label="Mobile navigation" onClick={closeMenu}><Link href="/#approach">Our approach</Link><Link href="/#support">How we can help</Link><Link href="/reflections">Reflections</Link><Link href="/#contact">Contact</Link><Link href="/book">Book a free call</Link><Link href="/sessions">Book a session</Link><Link href="/say">Anonymous Message</Link></nav></details>
  </header>;
}
