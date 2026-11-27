"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { SiteHeader } from "./site-header";

function VisitorHeader() {
  const pathname = usePathname() ?? "/";
  const adminOrProgress = pathname.startsWith("/manager") || pathname.startsWith("/work-in-progress");
  return adminOrProgress ? null : <SiteHeader />;
}

export function SiteFrame({ children, sheet }: { children: ReactNode; sheet: ReactNode }) {
  return <>
    <Suspense fallback={null}><VisitorHeader /></Suspense>
    {children}
    {sheet}
  </>;
}
