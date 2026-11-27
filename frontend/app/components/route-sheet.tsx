"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export function RouteSheet({ title, children, onClose }: { title: string; children: ReactNode; onClose?: () => void }) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const items = [...dialogRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter((item) => item.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (previousFocus.current?.isConnected) previousFocus.current.focus();
    };
    // The open sheet installs one keyboard and focus boundary for its lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    if (closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(() => onClose ? onClose() : router.back(), 320);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" && event.target === event.currentTarget) close();
  }

  return <>
    <button className={`route-sheet-dim${closing ? " is-closing" : ""}`} type="button" tabIndex={-1} aria-label="Close sheet" onClick={close}/>
    <section className={`route-sheet${closing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-labelledby="route-sheet-title" ref={dialogRef} onKeyDown={handleKeyDown}>
      <header className="route-sheet-head"><h2 className="route-sheet-title" id="route-sheet-title">{title}</h2><button className="route-sheet-close" type="button" aria-label="Close" ref={closeRef} onClick={close}>×</button></header>
      <div className="route-sheet-scroll"><div className="route-sheet-content">{children}</div></div>
    </section>
  </>;
}
