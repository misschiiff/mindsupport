import Link from "next/link";
import Image from "next/image";
import { Icon } from "./ui-icon";

export function SiteHeader() {
  return <header className="site-header"><Link className="brand" href="/" aria-label="Mindsupport home"><Image src="/mindsupport-logo.png" alt="mindsupport" width={600} height={200} priority /></Link><nav className="desktop-nav" aria-label="Main navigation"><Link href="/#approach">Our approach</Link><Link href="/#support">How we can help</Link><Link href="/#contact">Contact</Link></nav><Link className="header-cta" href="/say"><Icon name="message" size={17}/> Anonymous Message</Link><details className="mobile-menu"><summary aria-label="Open navigation"><span></span><span></span><span></span></summary><nav aria-label="Mobile navigation"><Link href="/#approach">Our approach</Link><Link href="/#support">How we can help</Link><Link href="/#contact">Contact</Link><Link href="/book">Free discovery call</Link><Link href="/sessions">Book a paid session</Link><Link href="/say">Anonymous Message</Link></nav></details></header>;
}
