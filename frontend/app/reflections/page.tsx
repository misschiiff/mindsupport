import Link from "next/link";

import { Icon } from "../components/ui-icon";
import { ReflectionsFeed } from "../components/reflections-feed";
import { HelpTip } from "../components/help-tip";

export const metadata = { title: "Reflections | Mindsupport", description: "Gentle reflections on the words and questions people carry." };

export default function ReflectionsPage() {
  return <main className="subpage reflections-page"><section className="reflections-content"><div className="section-label help-label">WORDS THAT MAKE ROOM <HelpTip label="Reflections">A place to read thoughts and experiences shared by others. Messages are reviewed before publication; you can like or download a reflection to keep or share it.</HelpTip></div><h1>Small reflections.<br/><em>Shared with care.</em></h1><p className="reflections-lede">Sometimes another person’s words help us find our own. Visitor messages appear here only after a team review. The examples below are clearly marked.</p><ReflectionsFeed/><Link className="button button-primary" href="/say">Share a thought anonymously <Icon name="arrow"/></Link></section></main>;
}
