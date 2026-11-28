import Link from "next/link";

import { Icon } from "../components/ui-icon";
import { SessionsBooking } from "../components/sessions-booking";
import { HelpTip } from "../components/help-tip";

export const metadata = { title: "Request a Therapy Session | Mindsupport", description: "Request a 15-minute first conversation, 2-hour session, or 5-hour session with Mindsupport. The team will contact you to agree the next step." };

export default function SessionsPage() {
  return <main className="subpage sessions-page"><section className="sessions-preview"><Link className="back-link" href="/"><span>←</span> Back to home</Link><div className="section-label help-label">SESSION REQUESTS <HelpTip label="Session requests">Choose the kind of conversation you’d like and tell us how to reach you. The team will contact you to discuss your needs and agree a time. A request is not confirmed until you hear from us.</HelpTip></div><h1>Let’s find a way<br/>forward together.</h1><p>Choose a first conversation or request a longer session. Mindsupport will follow up to understand what support would feel right.</p><SessionsBooking/><Link className="button button-outline" href="/book">Prefer to begin with a free call? <Icon name="arrow"/></Link></section></main>;
}
