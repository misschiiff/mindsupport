"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";
import { Icon } from "./ui-icon";

export function SiteHeader() {
  const menu = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeMenu = () => menu.current?.removeAttribute("open");
  const beginNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    closeMenu();
    const destination = new URL(event.currentTarget.href);
    if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;
    document.body.classList.add("is-navigating");
    if (navigationTimer.current) clearTimeout(navigationTimer.current);
    navigationTimer.current = setTimeout(() => document.body.classList.remove("is-navigating"), 4000);
  };

  useEffect(() => {
    document.body.classList.remove("is-navigating");
    if (navigationTimer.current) clearTimeout(navigationTimer.current);
  }, [pathname]);

  useEffect(() => () => {
    document.body.classList.remove("is-navigating");
    if (navigationTimer.current) clearTimeout(navigationTimer.current);
  }, []);

  return <header className="site-header">
    <Link className="brand" href="/" aria-label="Mindsupport home" onClick={beginNavigation}><Image src="/mindsupport-logo.png" alt="mindsupport" width={600} height={200} priority /></Link>
    <nav className="desktop-nav" aria-label="Main navigation"><Link href="/#approach" onClick={beginNavigation}>Our approach</Link><Link href="/#support" onClick={beginNavigation}>How we can help</Link><Link href="/reflections" onClick={beginNavigation}>Reflections</Link><Link href="/#contact" onClick={beginNavigation}>Contact</Link><Link href="/sessions" onClick={beginNavigation}>Book a session</Link></nav>
    <div className="header-actions"><Link className="header-cta header-cta-outline" href="/say" onClick={beginNavigation}><Icon name="message" size={17}/> Anonymous Message</Link><Link className="header-cta" href="/book" onClick={beginNavigation}>Book a free call</Link></div>
    <details className="mobile-menu" ref={menu}><summary aria-label="Open navigation"><span></span><span></span><span></span></summary><nav aria-label="Mobile navigation" onClick={closeMenu}><Link href="/#approach" onClick={beginNavigation}>Our approach</Link><Link href="/#support" onClick={beginNavigation}>How we can help</Link><Link href="/reflections" onClick={beginNavigation}>Reflections</Link><Link href="/#contact" onClick={beginNavigation}>Contact</Link><Link href="/book" onClick={beginNavigation}>Book a free call</Link><Link href="/sessions" onClick={beginNavigation}>Book a session</Link><Link href="/say" onClick={beginNavigation}>Anonymous Message</Link></nav></details>
  </header>;
}
