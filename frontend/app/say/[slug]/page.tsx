import { MessageForm } from "../../components/message-form";
import { HelpTip } from "../../components/help-tip";

export const metadata = { title: "Share a thought anonymously | Mindsupport", robots: { index: false, follow: false } };
export const instant = false;

export default async function CampaignMessagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  const source = campaign ? `Campaign: ${campaign}` : "Campaign: general";
  return <main className="message-page"><div className="message-layout campaign-layout"><section className="message-intro"><div className="section-label help-label">A QUIET SPACE TO SHARE <HelpTip label="Campaign message">This link opens an anonymous message form connected to a broad campaign source. Your message itself is still reviewed before anything is published.</HelpTip></div><h1>Say what’s<br/>on your mind.</h1><p>This anonymous message space is here if something from this topic is on your mind. Share only what feels comfortable.</p></section><MessageForm source={source}/></div></main>;
}
