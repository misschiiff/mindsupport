import Link from "next/link";

import { Icon } from "../components/ui-icon";
import { SessionsBooking } from "../components/sessions-booking";
import { HelpTip } from "../components/help-tip";

export const metadata = { title: "Direct sessions | Mindsupport" };

export default function SessionsPage() {
  return <main className="subpage sessions-page"><section className="sessions-preview"><Link className="back-link" href="/start"><span>←</span> Session options</Link><div className="section-label help-label">DIRECT SESSION BOOKING <HelpTip label="Direct sessions">Request a therapy session without first taking a discovery call. In this preview, your request is not sent, no appointment is reserved, and no payment is taken.</HelpTip></div><h1>Book a session<br/>that works for you.</h1><p>Choose the path that feels right for you.</p><SessionsBooking/><section className="session-after"><h2>Membership options</h2><div className="session-rates"><article><span>MONTHLY</span><b>₦10,000</b><small>1-month membership</small></article><article><span>SIX MONTHS</span><b>₦60,000</b><small>Membership term</small></article><article><span>AFTER 3 INCLUDED</span><b>₦10,000</b><small>Each additional session</small></article></div><small className="session-demo-hint">Membership includes three sessions after confirmed registration. Yearly and lifetime prices are being confirmed.</small></section><small className="not-live">Preview only. No registration or session is booked and no payment is taken.</small><Link className="button button-outline" href="/book">Start with a free call <Icon name="arrow"/></Link></section></main>;
}
