import Link from "next/link";
import { SiteHeader } from "../components/site-header";
import { Icon } from "../components/ui-icon";

export const metadata = { title: "Reflections | Mindsupport", description: "Gentle reflections on the words and questions people carry." };

const reflections = [
  { category: "BEGINNING", text: "I don’t know what I need yet. I just know I don’t want to keep carrying it on my own.", footer: "A thought about getting started" },
  { category: "FEELING STUCK", text: "What if I’m not looking for answers, just a place where I can say it out loud?", footer: "A question about being heard" },
  { category: "MAKING SPACE", text: "I want to understand why I keep showing up for everyone else and forgetting myself.", footer: "A reflection on caring for yourself" },
];

export default function ReflectionsPage() {
  return <main className="subpage reflections-page"><SiteHeader /><section className="reflections-content"><div className="section-label">WORDS THAT MAKE ROOM</div><h1>Small reflections.<br/><em>Shared with care.</em></h1><p className="reflections-lede">Sometimes another person’s words help us find our own. These examples show how the reflections space may look. No visitor messages are connected to this preview.</p><div className="demo-label"><Icon name="shield" size={16}/> Illustrative examples · Not submitted by visitors</div><div className="reflection-grid">{reflections.map((item) => <article className="reflection-card" key={item.category}><span>{item.category}</span><p>“{item.text}”</p><small>{item.footer}</small><div className="reflection-card-foot"><span>Shared anonymously</span><Icon name="heart" size={15}/></div></article>)}</div><Link className="button button-primary" href="/say">Share a thought anonymously <Icon name="arrow"/></Link></section></main>;
}
