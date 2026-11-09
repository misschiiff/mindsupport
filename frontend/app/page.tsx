import Link from "next/link";
import Image from "next/image";

const Arrow = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
const Sprout = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 39V23m0 8C8 31 7 18 7 11c11 0 17 4 17 13m0 2c0-12 8-18 17-18 0 11-4 19-17 19" /></svg>;

const approaches = [
  { icon: "◌", title: "A space to be heard", copy: "You don’t need to have the right words. We’ll start with what feels most present for you." },
  { icon: "⌁", title: "Care that fits you", copy: "Thoughtful, person-centred support shaped around your pace, needs and lived experience." },
  { icon: "♡", title: "Small steps count", copy: "Therapy isn’t about having it all figured out. It’s about finding a way forward, together." },
];

export default function Home() {
  return <main>
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Mindsupport home"><Image src="/mindsupport-logo.png" alt="mindsupport" width={600} height={200} priority /></Link>
      <nav className="desktop-nav" aria-label="Main navigation"><a href="#approach">Our approach</a><a href="#support">How we can help</a><a href="#contact">Contact</a><Link href="/reflections">Reflections</Link></nav>
      <Link className="header-cta" href="/say"><span className="header-message-icon">◌</span> Anonymous Message</Link>
      <details className="mobile-menu"><summary aria-label="Open navigation"><span></span><span></span><span></span></summary><nav aria-label="Mobile navigation"><a href="#approach">Our approach</a><a href="#support">How we can help</a><a href="#contact">Contact</a><Link href="/reflections">Reflections</Link><Link href="/say">Anonymous Message</Link><Link href="/start">Book a session</Link></nav></details>
    </header>

    <section className="hero">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"></span> A LITTLE SPACE TO FEEL MORE LIKE YOU</div>
        <h1>You don’t have to<br/><em>figure it all out</em><br/>on your own.</h1>
        <p className="hero-lede">A thoughtful, human space to talk things through, find your footing, and move at your own pace.</p>
        <div className="hero-actions"><Link className="button button-primary" href="/start">Explore session options <Arrow /></Link><a className="text-link" href="#approach">Get to know us <span>↓</span></a></div>
        <p className="hero-note"><span>✳</span> No pressure. Just a first conversation.</p>
      </div>
      <div className="hero-art" aria-label="Illustration of two people supporting one another" role="img">
        <div className="art-halo"></div><div className="art-sun"></div><div className="art-leaf leaf-one"></div><div className="art-leaf leaf-two"></div>
        <div className="person person-back"><i className="head"></i><i className="body"></i></div><div className="person person-front"><i className="head"></i><i className="body"></i></div>
        <div className="art-caption"><Sprout /><span>There’s room<br/>for all of you here.</span></div>
        <div className="art-tag"><span>✳</span> YOU, AT YOUR OWN PACE</div>
      </div>
      <div className="hero-bottom"><span>Psychotherapy, with you at the centre</span><span>Scroll to find your way <b>↓</b></span></div>
    </section>

    <section className="intro-section" id="approach"><div className="section-label">A GENTLER WAY FORWARD</div><h2>Some things are easier<br/>when you <em>don’t carry them alone.</em></h2><p>Whether you’re feeling stuck, stretched thin, or simply ready to understand yourself a little better, therapy can be a place to begin.</p></section>
    <section className="approach-grid" id="support">{approaches.map((item) => <article className="approach-card" key={item.title}><span className="approach-icon">{item.icon}</span><h3>{item.title}</h3><p>{item.copy}</p></article>)}</section>
    <section className="message-band"><div><div className="section-label">WORDS WHEN YOU’RE READY</div><h2>Not sure what to say?<br/><em>Start anywhere.</em></h2><p>You can leave us a private, anonymous message. No name or email needed. It’s simply a quiet first step.</p><Link className="button button-light" href="/message">Leave an anonymous message <Arrow /></Link></div><div className="message-art"><div className="message-orbit orbit-a"></div><div className="message-orbit orbit-b"></div><div className="message-note">“I don’t know where to start, but…”<span>— just a thought, for now</span></div><span className="message-spark">✳</span></div></section>
    <section className="closing-cta" id="contact"><span className="closing-flower">✳</span><div className="section-label">A FIRST STEP, NO STRINGS</div><h2>Let’s start with<br/><em>a conversation.</em></h2><p>Choose a free discovery call or explore direct sessions. We’ll help you find a first step that feels right.</p><Link className="button button-primary" href="/start">Explore session options <Arrow /></Link><span className="closing-note">Online or in person · Whichever feels right for you</span></section>
    <footer className="site-footer"><Link className="footer-brand" href="/"><Image src="/mindsupport-mark.png" alt="" width={90} height={90}/><span>mindsupport<small>PSYCHOTHERAPY LTD</small></span></Link><span>Care that meets you where you are.</span><Link href="/reflections">Reflections</Link><Link href="/work-in-progress">Development preview</Link></footer>
  </main>;
}
