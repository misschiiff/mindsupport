import Link from "next/link";
import { SiteHeader } from "../components/site-header";
import { Icon } from "../components/ui-icon";

export const metadata = { title: "Direct sessions | Mindsupport" };

export default function SessionsPage() {
  return <main className="subpage sessions-page"><SiteHeader /><section className="sessions-preview"><Link className="back-link" href="/start"><span>←</span> Session options</Link><div className="section-label">DIRECT SESSION BOOKING</div><h1>Begin when<br/><em>you feel ready.</em></h1><p>Choose a therapist, session format, and available time. We’ll show the full cost before you confirm.</p><div className="session-empty"><span className="session-empty-icon"><Icon name="calendar" size={25}/></span><h2>Session availability is being prepared.</h2><p>Therapist profiles, session length, current availability, and pricing need to be confirmed before we can safely open direct bookings.</p><div className="session-steps"><span><i>1</i> Choose a therapist</span><span><i>2</i> Select a time</span><span><i>3</i> Review cost &amp; pay securely</span></div><small>Paystack checkout and payment confirmation are not active in this frontend preview.</small></div><Link className="button button-primary" href="/book">Start with a free discovery call <Icon name="arrow"/></Link></section></main>;
}
