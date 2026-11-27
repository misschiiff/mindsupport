import Link from "next/link";
import { MessageForm } from "../components/message-form";
import { HelpTip } from "../components/help-tip";


export const metadata = { title: "Send an anonymous message | Mindsupport", description: "Send an anonymous message for publication on Mindsupport’s official social media. Requesting an email or social media reply is optional." };

export default function MessagePage() {
  return <main className="subpage message-page"><div className="message-layout"><section className="message-intro"><Link className="back-link" href="/"><span>←</span> Back to home</Link><div className="section-label help-label">A PRIVATE FIRST STEP <HelpTip label="Anonymous messages">Write without entering your name or email. Before you send, you’ll see the publication consent so you can understand how messages may be shared.</HelpTip></div><h1>Say what’s<br/>on your mind.</h1><p>Share only what feels comfortable. You don’t need to leave your name or email.</p></section><MessageForm/></div><footer className="subpage-footer">Mindsupport Psychotherapy Ltd <span>·</span> <Link href="/book">Would you prefer a free call?</Link></footer></main>;
}
