import Link from "next/link";
import { MessageForm } from "../components/message-form";
import { SiteHeader } from "../components/site-header";

export const metadata = { title: "Leave an anonymous message | Mindsupport", description: "A private, low-pressure first step. No name or email needed." };

export default function MessagePage() {
  return <main className="subpage message-page"><SiteHeader /><div className="message-layout"><section className="message-intro"><Link className="back-link" href="/"><span>←</span> Back to home</Link><div className="section-label">WORDS WHEN YOU’RE READY</div><h1>Start anywhere.<br/><em>It can be anonymous.</em></h1><p>You don’t need to find the perfect words. Leave a thought, a question, or a little about what has been on your mind.</p><div className="message-promise"><span>✳</span><div><b>No name or email needed</b><small>You decide what to share and when.</small></div></div><div className="message-promise"><span>♡</span><div><b>No pressure to book</b><small>This can simply be a first step.</small></div></div></section><MessageForm/></div><footer className="subpage-footer">Mindsupport Psychotherapy Ltd <span>·</span> <Link href="/book">Would you prefer a free call?</Link></footer></main>;
}
