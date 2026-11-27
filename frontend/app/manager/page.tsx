import Link from "next/link";
import { ManagerWorkspace } from "../components/manager-workspace";

export const metadata = { title: "Practice manager preview | Mindsupport", robots: { index: false, follow: false } };

export default function ManagerPage() {
  return <main className="manager-page"><header className="manager-top"><div><span className="section-label">PRACTICE WORKSPACE</span><h1>Good morning, <em>team.</em></h1></div><span className="demo-mode"><i/> LOCAL DEMO DATA</span></header><div className="manager-alert"><p><b>Interactive preview · Fictional data only.</b> Visitor submissions, manual leads, bookings and opt-ins stay in this browser. There is no staff sign-in, database, email delivery, or live payment provider. Do not enter real client information.</p></div><ManagerWorkspace/><footer className="manager-footer"><Link href="/work-in-progress">Project progress</Link><span>Browser-only preview · fictional sample content</span></footer></main>;
}
