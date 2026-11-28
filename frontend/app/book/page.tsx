import Link from "next/link";
import { BookingForm } from "../components/booking-form";

import { Icon } from "../components/ui-icon";
import { HelpTip } from "../components/help-tip";

export const metadata = { title: "Book a free introductory call | Mindsupport", description: "Tell us a little about what works for you and request a free introductory call." };

export default function BookPage() {
  return <main className="subpage booking-page"><div className="booking-layout"><section className="booking-aside"><Link className="back-link" href="/"><span>←</span> Back to home</Link><div className="section-label help-label">A GENTLE PLACE TO BEGIN <HelpTip label="Free discovery call">A short, no-pressure conversation to ask questions and see what kind of support could suit you. Sending a request does not reserve an appointment; the team will follow up.</HelpTip></div><h1>Let’s find a time<br/>that works for you.</h1><div className="booking-benefits"><div><span><Icon name="clock" size={19}/></span><p><b>Free and informal</b><small>No commitment, no pressure to continue.</small></p></div><div><span><Icon name="video" size={19}/></span><p><b>Online or in person</b><small>Choose the way of meeting that feels best.</small></p></div><div><span><Icon name="shield" size={19}/></span><p><b>Shared with care</b><small>We’ll only use your details to follow up.</small></p></div></div><blockquote className="booking-quote"><p>“You don’t need to know exactly what to say.”</p><small>It’s okay to start wherever you are.</small></blockquote></section><BookingForm/><section className="booking-after"><p>A free, informal 15-minute conversation. No pressure to continue.</p><p>Choose online, in person, or either. We’ll follow up to arrange a time.</p><Link href="/sessions">Already know what you need? Book a session <Icon name="arrow" size={15}/></Link></section></div><footer className="subpage-footer">Mindsupport Psychotherapy Ltd <span>·</span> <Link href="/message">Prefer to write first?</Link></footer></main>;
}
