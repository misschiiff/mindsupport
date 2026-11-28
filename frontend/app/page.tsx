import Link from "next/link";
import Image from "next/image";
import { Icon } from "./components/ui-icon";
import { LocalBusinessSchema } from "./components/local-business-schema";
import { HelpTip } from "./components/help-tip";


export const metadata = {
  title: "Psychotherapy & Counselling Support | Mindsupport",
  description: "Looking for someone to talk to? Mindsupport offers thoughtful psychotherapy and counselling support online or in person. Request a free discovery call at your own pace.",
  alternates: { canonical: "/" },
};

const Arrow = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
const Sprout = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 39V23m0 8C8 31 7 18 7 11c11 0 17 4 17 13m0 2c0-12 8-18 17-18 0 11-4 19-17 19" /></svg>;

const approaches = [
  { icon: "message", title: "A space to be heard", copy: "You don’t need to have the right words. We’ll start with what feels most present for you." },
  { icon: "heart", title: "Care that fits you", copy: "Thoughtful, person-centred support shaped around your pace, needs and lived experience." },
  { icon: "shield", title: "Small steps count", copy: "Therapy isn’t about having it all figured out. It’s about finding a way forward, together." },
];

export default function Home() {
  return <main>
    <LocalBusinessSchema />


    <section className="hero">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"></span> A LITTLE SPACE TO FEEL MORE LIKE YOU</div>
        <h1>You don’t have to<br/><em>figure it all out</em><br/>on your own.</h1>
        <p className="hero-lede">A thoughtful, human space to talk things through, find your footing, and move at your own pace.</p>
        <div className="hero-actions"><Link className="button button-primary" href="/book">Book a free call <Arrow /></Link><Link className="text-link" href="/sessions">Direct sessions <Arrow /></Link></div>
        <p className="hero-note"><span>✳</span> No pressure. Just a first conversation.</p>
      </div>
      <div className="hero-art">
        <div className="art-halo"></div><div className="art-sun"></div><div className="art-leaf leaf-one"></div><div className="art-leaf leaf-two"></div>
        <div className="hero-mark"><Image src="/mindsupport-mark.png" alt="Mindsupport people and heart mark" width={300} height={300} priority /></div>
        <div className="art-caption"><Sprout /><span>There is space<br/>for you here.</span></div>
        <div className="art-tag"><span>✳</span> YOU, AT YOUR OWN PACE</div>
      </div>
      <div className="hero-bottom"><span>Psychotherapy, with you at the centre</span><span>Scroll to find your way <b>↓</b></span></div>
    </section>

    <section className="intro-section" id="approach"><div className="section-label help-label">CARE THAT STARTS WITH YOU <HelpTip label="Care that starts with you">This section introduces how Mindsupport offers therapy and conversation: with you setting the pace, space to ask questions, and different ways to take a first step.</HelpTip></div><h2>Some things are easier<br/>when you <em>don’t carry them alone.</em></h2><p>Looking for someone to talk to? Mindsupport Psychotherapy Ltd offers a thoughtful place to explore therapy, ask questions, and find support at your own pace. Whether you’re feeling overwhelmed, stuck, or ready to understand yourself a little better, you can begin with a free discovery call.</p><Link className="text-link intro-link" href="/start">Explore ways to begin <Arrow /></Link></section>
    <section className="approach-grid" id="support">{approaches.map((item) => <article className="approach-card" key={item.title}><span className="approach-icon"><Icon name={item.icon} size={20}/></span><h3>{item.title}</h3><p>{item.copy}</p></article>)}</section>
    <section className="message-band"><div><div className="section-label help-label">WORDS WHEN YOU’RE READY <HelpTip label="Anonymous messages">Share a thought without adding your name or email. You’ll see the publication consent and privacy details before sending.</HelpTip></div><h2>Not sure what to say?<br/><em>Start anywhere.</em></h2><p>You can leave us a private, anonymous message. No name or email needed. It’s simply a quiet first step.</p><Link className="button button-light" href="/message">Leave an anonymous message <Arrow /></Link></div><div className="message-art"><div className="message-orbit orbit-a"></div><div className="message-orbit orbit-b"></div><div className="message-note">“I don’t know where to start, but…”<span>— just a thought, for now</span></div><span className="message-spark">✳</span></div></section>
    <section className="closing-cta" id="contact"><span className="closing-flower">✳</span><div className="section-label">A FIRST STEP, NO STRINGS</div><h2>Let’s start with<br/><em>a conversation.</em></h2><p>Looking for a therapist or a space to talk? Choose a free call or explore a direct session. We’ll help you find a first step that feels right.</p><div className="closing-actions"><Link className="button button-primary" href="/book">Book a free call <Arrow /></Link><Link className="button button-outline" href="/sessions">Direct sessions <Arrow /></Link></div><span className="closing-note">Online or in person · Whichever feels right for you</span></section>
    <section className="search-questions" aria-labelledby="search-questions-title"><div className="section-label">COMMON QUESTIONS</div><h2 id="search-questions-title">Thinking about talking to someone?</h2><details><summary>How do I know if therapy might help?</summary><p>You don’t need to have everything figured out before reaching out. A free discovery call is a chance to ask questions and see whether Mindsupport feels like a good fit.</p></details><details><summary>Can I speak with a therapist online?</summary><p>Mindsupport offers online and in-person ways to meet. You can share your preference when you request a free discovery call.</p></details><details><summary>What if I’m not ready to book?</summary><p>You can leave an anonymous message without adding your name or email. This preview does not send or save messages.</p></details></section>
    <footer className="site-footer"><Link className="footer-brand" href="/"><Image src="/mindsupport-mark.png" alt="" width={90} height={90}/><span>mindsupport<small>PSYCHOTHERAPY LTD</small></span></Link><span>Care that meets you where you are.</span><Link href="/reflections">Reflections</Link><Link href="/say">Anonymous message</Link><Link href="/work-in-progress">Development preview</Link></footer>
  </main>;
}
