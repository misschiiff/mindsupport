import Link from "next/link";
import { BookingForm } from "../components/booking-form";
import { SiteHeader } from "../components/site-header";
import { Icon } from "../components/ui-icon";

export const metadata = { title: "Book a free introductory call | Mindsupport", description: "Tell us a little about what works for you and request a free introductory call." };

export default function BookPage() {
  return <main className="subpage booking-page"><SiteHeader /><div className="booking-layout"><section className="booking-aside"><Link className="back-link" href="/"><span>←</span> Back to home</Link><div className="section-label">A GENTLE PLACE TO BEGIN</div><h1>One small step.<br/><em>At your own pace.</em></h1><p className="aside-copy">A free introductory call is just a conversation. We’ll listen, answer questions, and see together what kind of support might feel right.</p><div className="aside-detail"><Icon name="clock"/><span><b>Free and informal</b><small>No commitment, no pressure to continue.</small></span></div><div className="aside-detail"><Icon name="video"/><span><b>Online or in person</b><small>Choose the way of meeting that feels best.</small></span></div><div className="aside-detail"><Icon name="shield"/><span><b>Shared with care</b><small>We’ll only use your details to follow up.</small></span></div><div className="aside-quote">“You don’t need to know exactly what to say.”<span>It’s okay to start wherever you are.</span></div></section><BookingForm/></div><footer className="subpage-footer">Mindsupport Psychotherapy Ltd <span>·</span> <Link href="/message">Prefer to write first?</Link></footer></main>;
}
