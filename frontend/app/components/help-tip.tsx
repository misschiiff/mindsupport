"use client";

import { useEffect, useState } from "react";
import { RouteSheet } from "./route-sheet";
import { Icon } from "./ui-icon";

const CLOSE_HELP_SHEETS = "mindsupport:close-help-sheets";

export function HelpTip({ label, children }: { label: string; children: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const closeOtherSheets = () => setOpen(false);
    window.addEventListener(CLOSE_HELP_SHEETS, closeOtherSheets);
    return () => window.removeEventListener(CLOSE_HELP_SHEETS, closeOtherSheets);
  }, []);

  function showHelp() {
    window.dispatchEvent(new Event(CLOSE_HELP_SHEETS));
    setOpen(true);
  }

  return <>
    <button className="help-tip-button" type="button" aria-label={`About ${label}`} aria-haspopup="dialog" aria-expanded={open} onClick={showHelp}>
      <Icon name="info" size={16}/>
    </button>
    {open && <RouteSheet title={label} onClose={() => setOpen(false)}>
      <div className="help-sheet-copy"><p>{children}</p></div>
    </RouteSheet>}
  </>;
}
