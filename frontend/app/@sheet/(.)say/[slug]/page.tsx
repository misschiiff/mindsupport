import { RouteSheet } from "../../../components/route-sheet";
import Page from "../../../say/[slug]/page";

export const instant = false;

export default function CampaignSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  return <RouteSheet title="Anonymous message"><Page params={params} /></RouteSheet>;
}
