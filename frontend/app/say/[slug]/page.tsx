import { MessageForm } from "../../components/message-form";
import { SiteHeader } from "../../components/site-header";
import { Icon } from "../../components/ui-icon";

export const metadata = { title: "Share a thought anonymously | Mindsupport", robots: { index: false, follow: false } };
export const instant = false;

export default async function CampaignMessagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return <main className="message-page"><SiteHeader /><div className="message-layout campaign-layout"><section className="message-intro"><div className="section-label">A QUIET SPACE TO SHARE</div><h1>{title || "Start anywhere"}.<br/><em>Your words are welcome.</em></h1><p>This anonymous message space is here if something from this topic is on your mind. Share only what feels comfortable.</p><div className="message-promise"><span>✳</span><div><b>No name or email needed</b><small>This campaign preview does not identify its visitors.</small></div></div><div className="campaign-tag"><Icon name="shield" size={16}/> Campaign: {slug}</div></section><MessageForm/></div></main>;
}
